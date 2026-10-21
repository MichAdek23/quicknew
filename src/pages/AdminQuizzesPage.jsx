import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  FolderOpen,
  HelpCircle,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { academicService } from '../lib/academicService';

export default function AdminQuizzesPage() {
  const [activeTab, setActiveTab] = useState('scoreboard');
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Forge states
  const [materialId, setMaterialId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_option: 0 },
  ]);
  const [deploying, setDeploying] = useState(false);
  const [forgeError, setForgeError] = useState('');
  const [forgeSuccess, setForgeSuccess] = useState('');

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [attemptsData, quizzesData, materialsData] = await Promise.all([
        academicService.getAllQuizAttempts(),
        academicService.getQuizzes(),
        academicService.getMaterials(false),
      ]);
      setAttempts(attemptsData);
      setQuizzes(quizzesData);
      setMaterials(materialsData);
    } catch (err) {
      console.warn('Error loading quiz telemetry:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Forge helpers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', options: ['', '', '', ''], correct_option: 0 },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestionText = (idx, text) => {
    const updated = [...questions];
    updated[idx].question_text = text;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx, optIdx, text) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = text;
    setQuestions(updated);
  };

  const handleUpdateCorrectOption = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].correct_option = optIdx;
    setQuestions(updated);
  };

  const handleDeployQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setForgeError('Please provide a Quiz Title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setForgeError(`Question #${i + 1} is missing question text.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setForgeError(`All 4 options for Question #${i + 1} must be filled out.`);
        return;
      }
    }

    setDeploying(true);
    setForgeError('');
    setForgeSuccess('');

    try {
      const res = await academicService.deployQuiz({
        materialId: materialId || null,
        title: quizTitle.trim(),
        questions,
      });

      if (!res.success) throw new Error(res.error);

      setForgeSuccess('Quiz and questions successfully deployed to Supabase!');
      setQuizTitle('');
      setMaterialId('');
      setQuestions([{ question_text: '', options: ['', '', '', ''], correct_option: 0 }]);
      await loadData();
      setTimeout(() => {
        setForgeSuccess('');
        setActiveTab('quizzes');
      }, 1500);
    } catch (err) {
      setForgeError(err?.message || 'Failed to deploy quiz.');
    } finally {
      setDeploying(false);
    }
  };

  const handleDeleteAttempt = async (attemptId) => {
    if (!window.confirm('Delete this attempt record? The student will be allowed to retake the quiz.')) return;
    try {
      await academicService.deleteQuizAttempt(attemptId);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    } catch (err) {
      console.error('Error deleting quiz attempt:', err);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz and all attached questions?')) return;
    try {
      await academicService.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  const filteredAttempts = attempts.filter((att) => {
    const term = search.toLowerCase();
    const student = (att.user?.full_name || att.user?.email || '').toLowerCase();
    const title = (att.quiz?.title || '').toLowerCase();
    return student.includes(term) || title.includes(term);
  });

  const averageScore =
    attempts.length > 0
      ? (
          (attempts.reduce((sum, a) => sum + (a.total > 0 ? a.score / a.total : 0), 0) /
            attempts.length) *
          100
        ).toFixed(1)
      : '0.0';

  const passRate =
    attempts.length > 0
      ? ((attempts.filter((a) => a.passed).length / attempts.length) * 100).toFixed(1)
      : '0.0';

  return (
    <AdminLayout title="Quizzes & Scores">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Assessments</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Assessments &amp; Quiz Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Live student assessment telemetry, real-time score grading, and Quiz Forge builder.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={refreshing}
              className="border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-widest text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs font-semibold rounded-full"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'} />
              <span>{refreshing ? 'Syncing Live…' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </header>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-gray-200/90 bg-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono block mb-2">
              Total Quiz Attempts
            </span>
            <div className="text-3xl font-bold text-gray-900 tracking-tight font-serif mb-1" style={{ fontFamily: '"Besley", Georgia, serif' }}>
              {attempts.length}
            </div>
            <p className="text-xs text-gray-400 font-mono">Completed by student founders</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00873E]" />
          </div>

          <div className="border border-gray-200/90 bg-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono block mb-2">
              Average Performance
            </span>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight font-mono mb-1">
              {averageScore}%
            </div>
            <p className="text-xs text-gray-400 font-mono">Across all completed assessments</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          <div className="border border-gray-200/90 bg-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono block mb-2">
              Pass Rate (≥70%)
            </span>
            <div className="text-3xl font-bold text-gray-900 tracking-tight font-mono mb-1">
              {passRate}%
            </div>
            <p className="text-xs text-gray-400 font-mono">
              {attempts.filter((a) => a.passed).length} passing attempts
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('scoreboard')}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'scoreboard'
                ? 'border-[#00873E] text-[#00873E]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Student Scoreboard ({attempts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quizzes'
                ? 'border-[#00873E] text-[#00873E]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Active Quizzes ({quizzes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forge')}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forge'
                ? 'border-[#00873E] text-[#00873E]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Plus size={13} />
            <span>Quiz Forge</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: STUDENT SCOREBOARD                                */}
        {/* ======================================================== */}
        {activeTab === 'scoreboard' && (
          <div>
            <div className="mb-4 max-w-md relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by student name or quiz title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] rounded-xl font-mono shadow-2xs"
              />
            </div>

            <div className="border border-gray-200 bg-white shadow-xs rounded-2xl overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs text-gray-400 font-mono">
                  Loading scoreboard records…
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div className="py-20 text-center p-8">
                  <FolderOpen size={30} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-800 mb-1">No Assessment Attempts Found</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Student quiz submissions and diagnostic scores will stream here live.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-mono text-[10px] border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3.5">Student / Founder</th>
                        <th className="px-6 py-3.5">Assessment Title</th>
                        <th className="px-6 py-3.5">Score</th>
                        <th className="px-6 py-3.5">Grade Status</th>
                        <th className="px-6 py-3.5">Completed Date</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAttempts.map((att) => {
                        const pct = att.total > 0 ? Math.round((att.score / att.total) * 100) : 0;
                        return (
                          <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-gray-900 font-semibold">
                                {att.user?.full_name || 'Student'}
                              </p>
                              <p className="text-[11px] text-gray-500 font-mono">
                                {att.user?.email || att.user_id.slice(0, 10)}
                              </p>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-800">
                              {att.quiz?.title || 'Diagnostic Assessment'}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              <span className="font-bold text-gray-900">{att.score}</span>
                              <span className="text-gray-400"> / {att.total}</span>
                              <span className="text-xs ml-2 text-gray-600 font-medium">({pct}%)</span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                                  att.passed
                                    ? 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0]'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {att.passed ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                <span>{att.passed ? 'Passed (≥70%)' : 'Needs Review'}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-400">
                              {att.created_at ? new Date(att.created_at).toLocaleString() : 'Recent'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteAttempt(att.id)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-mono hover:underline cursor-pointer font-medium"
                                title="Reset / Delete Attempt to allow re-test"
                              >
                                Reset Attempt
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ACTIVE QUIZZES CATALOGUE                          */}
        {/* ======================================================== */}
        {activeTab === 'quizzes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-gray-200 bg-gray-50/50 p-8 rounded-2xl">
                <FolderOpen size={30} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-800 mb-1">No Quizzes Live</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Switch to the Quiz Forge tab to deploy your first assessment matrix.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('forge')}
                  className="px-4 py-2 bg-[#00873E] text-white text-xs font-semibold rounded-full"
                >
                  Open Quiz Forge
                </button>
              </div>
            ) : (
              quizzes.map((q) => (
                <div
                  key={q.id}
                  className="border border-gray-200 bg-white shadow-xs rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0] font-semibold">
                        <FileCheck2 size={11} className="text-[#00873E]" />
                        <span>Assessment Matrix</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono font-semibold">Live</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                      {q.title}
                    </h3>

                    {q.material && (
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-4">
                        <span className="text-gray-400">Target:</span>
                        <span className="text-[#00873E] font-medium truncate">{q.material.title}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                    <span className="text-[10px] font-mono text-gray-400">
                      Created: {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(q.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: QUIZ FORGE BUILDER                                */}
        {/* ======================================================== */}
        {activeTab === 'forge' && (
          <div className="border border-gray-200 bg-white shadow-xs rounded-2xl p-6 md:p-8 max-w-4xl">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900">Quiz Forge Studio</h2>
              <p className="text-xs text-gray-500 mt-1">
                Construct new diagnostic assessments with multiple-choice choices and authoritative answer keys.
              </p>
            </div>

            {forgeError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-600" />
                <span>{forgeError}</span>
              </div>
            )}

            {forgeSuccess && (
              <div className="mb-6 p-3 bg-[#E6F4EA] border border-[#C2E7D0] text-[#006837] text-xs rounded-xl flex items-center gap-2">
                <CheckCircle size={14} className="shrink-0 text-[#00873E]" />
                <span>{forgeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDeployQuiz} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Linked Material Endpoint (Optional)
                  </label>
                  <select
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none cursor-pointer"
                  >
                    <option value="">Independent Exam (No material linked)</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g. Motor Learning & Sports Psychology Diagnostics"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                  />
                </div>
              </div>

              {/* Questions Array */}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <HelpCircle size={15} className="text-[#00873E]" />
                    <span>Questions ({questions.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 bg-[#E6F4EA] hover:bg-[#C2E7D0] text-[#006837] font-semibold rounded-full text-xs border border-[#C2E7D0] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={12} />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 relative space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 font-mono">
                        Question #{qIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-mono cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={q.question_text}
                        onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                        placeholder="Enter the examination question text..."
                        className="w-full bg-white border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] text-gray-500 block font-semibold">
                        Answer Options &bull; Select the radio of the correct answer:
                      </span>
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correct_option === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                              isCorrect
                                ? 'bg-[#E6F4EA] border-[#00873E]'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={isCorrect}
                              onChange={() => handleUpdateCorrectOption(qIdx, optIdx)}
                              className="cursor-pointer"
                              style={{ accentColor: '#00873E' }}
                              title="Mark as correct answer"
                            />
                            <span className="font-mono text-gray-500 text-xs font-bold w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                              className="flex-1 bg-transparent border-none text-gray-900 outline-none text-xs"
                            />
                            {isCorrect && (
                              <span className="text-[10px] text-[#006837] font-mono font-semibold">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full cursor-pointer font-medium"
                >
                  Add Another Question
                </button>
                <button
                  type="submit"
                  disabled={deploying}
                  className="px-6 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white font-semibold rounded-full transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {deploying && <Loader2 size={13} className="animate-spin" />}
                  <span>{deploying ? 'Deploying to Supabase…' : 'Deploy Assessment Live'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
