import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  Lock,
  Award,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { supabase } from '../lib/supabase';
import { academicService } from '../lib/academicService';
import { useAuth } from '../context/AuthContext';
import { premiumService, DEFAULT_PREMIUM_PLAN } from '../lib/premiumService';

export default function DashboardExamRunnerPage() {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const { user, profile } = useAuth();

  const [phase, setPhase] = useState('LOADING'); // 'LOADING' | 'LOCKED' | 'PRIOR_ATTEMPT' | 'INSTRUCTIONS' | 'TESTING' | 'COMPLETED' | 'PENALIZED'
  const [quiz, setQuiz] = useState(null);
  const [premiumPlan, setPremiumPlan] = useState(DEFAULT_PREMIUM_PLAN);
  const [priorAttempt, setPriorAttempt] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [error, setError] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Refs to prevent closure staleness in window event listeners
  const selectedRef = useRef(selectedAnswers);
  const phaseRef = useRef(phase);
  const questionsRef = useRef([]);

  useEffect(() => {
    selectedRef.current = selectedAnswers;
    phaseRef.current = phase;
  }, [selectedAnswers, phase]);

  // Load Quiz Data and Check Prior Attempts
  useEffect(() => {
    const initExam = async () => {
      if (!quizId || !user) return;
      try {
        // 1. Check if user already took this quiz
        const { data: attemptData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (attemptData) {
          setPriorAttempt(attemptData);
        }

        // 2. Fetch Quiz with Questions & Plan
        const [{ data: quizData, error: qErr }, planData] = await Promise.all([
          supabase
            .from('quizzes')
            .select('*, quiz_questions(*), materials(id, title)')
            .eq('id', quizId)
            .single(),
          premiumService.getPremiumPlan(),
        ]);

        if (planData) setPremiumPlan(planData);

        if (qErr || !quizData) {
          setError('Quiz not found or has been disabled.');
          setPhase('ERROR');
          return;
        }

        // 3. Check Premium Access
        const access = premiumService.checkAccess(quizData.material_id, profile, planData || premiumPlan);
        if (!access.hasAccess) {
          setQuiz(quizData);
          setPhase('LOCKED');
          return;
        }

        setQuiz(quizData);
        questionsRef.current = quizData.quiz_questions || [];

        if (attemptData) {
          setPhase('PRIOR_ATTEMPT');
        } else {
          setPhase('INSTRUCTIONS');
        }
      } catch (err) {
        console.error('Error initializing exam:', err);
        setError('Failed to establish secure exam connection.');
        setPhase('ERROR');
      }
    };

    initExam();
  }, [quizId, user]);

  // Realtime unlock if student activates subscription while on LOCKED screen
  useEffect(() => {
    if (phase === 'LOCKED' && quiz && profile) {
      const access = premiumService.checkAccess(quiz.material_id, profile, premiumPlan);
      if (access.hasAccess) {
        if (priorAttempt) {
          setPhase('PRIOR_ATTEMPT');
        } else {
          setPhase('INSTRUCTIONS');
        }
      }
    }
  }, [profile, phase, quiz, premiumPlan, priorAttempt]);

  // Anti-Cheat: Visibility Change Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && phaseRef.current === 'TESTING') {
        console.warn('[ANTI-CHEAT] Focus lost. Auto-submitting assessment.');
        triggerPenalty('Focus loss detected: You left or switched browser tabs during a strict assessment.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const calculateScore = (answers) => {
    const questions = questionsRef.current;
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        score += 1;
      }
    });
    return score;
  };

  const triggerPenalty = async (reason) => {
    setSubmitting(true);
    setPenaltyReason(reason);
    const questions = questionsRef.current;
    const score = calculateScore(selectedRef.current);

    try {
      await academicService.submitQuizAttempt(quizId, score, questions.length, selectedRef.current);
      setFinalScore(score);
      setPhase('PENALIZED');
    } catch (err) {
      console.error('Failed to submit penalized attempt:', err);
      setPhase('PENALIZED');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    const questions = questionsRef.current;
    const score = calculateScore(selectedAnswers);

    try {
      await academicService.submitQuizAttempt(quizId, score, questions.length, selectedAnswers);
      setFinalScore(score);
      setPhase('COMPLETED');
    } catch (err) {
      console.error('Submission failed:', err);
      setError('Failed to record exam attempt in Supabase. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (questionId, optionIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const questions = quiz?.quiz_questions || [];

  return (
    <DashboardLayout title="Knowledge Assessment">
      <div className="mx-auto max-w-3xl pb-12">
        {/* Loading Phase */}
        {phase === 'LOADING' && (
          <div className="p-16 border border-gray-200 bg-white rounded-2xl text-center shadow-xs">
            <Loader2 size={32} className="animate-spin text-[#00873E] mx-auto mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Initializing Secure Assessment Suite…
            </p>
          </div>
        )}

        {/* Error Phase */}
        {phase === 'ERROR' && (
          <div className="p-8 border border-red-200 bg-red-50/50 rounded-2xl text-center">
            <AlertTriangle size={36} className="text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-serif text-gray-900 mb-2" style={{ fontFamily: '"Besley", Georgia, serif' }}>
              Assessment Unavailable
            </h2>
            <p className="text-xs text-gray-600 mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-xs font-mono uppercase tracking-wider text-gray-800 hover:border-[#00873E] hover:text-[#00873E] transition-colors rounded-full shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Return to Catalogue</span>
            </Link>
          </div>
        )}

        {/* Phase: Locked (Non-Premium User) */}
        {phase === 'LOCKED' && quiz && (
          <div className="p-8 sm:p-12 border border-[#C2E7D0] bg-white rounded-3xl text-center shadow-xs max-w-xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#E6F4EA] border border-[#C2E7D0] text-[#00873E] flex items-center justify-center mb-4">
              <Lock size={28} />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00873E] font-semibold mb-2">
              Premium Assessment Locked
            </span>
            <h2
              className="text-2xl font-bold font-serif text-gray-900 mb-2"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              {quiz.title}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto mb-5">
              Knowledge check evaluations and score certifications are exclusively accessible to verified QuickHedge Premium Members.
            </p>
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-mono font-bold text-gray-900">
              <span>Pass Fee: ₦{Number(premiumPlan.price_ngn || 0).toLocaleString()}</span>
              <span>•</span>
              <span className="text-[#00873E]">{premiumPlan.duration_days} Days Access</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <Link
                href="/dashboard/scores"
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono uppercase tracking-wider rounded-full transition-colors"
              >
                Back to Scores
              </Link>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Unlock Assessment</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Prior Attempt Screen */}
        {phase === 'PRIOR_ATTEMPT' && priorAttempt && quiz && (
          <div className="p-8 sm:p-10 border border-gray-200 bg-white rounded-2xl text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#E6F4EA] border border-[#C2E7D0] text-[#00873E] flex items-center justify-center mx-auto mb-4">
              <Award size={32} />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00873E] font-semibold">
              Assessment Previously Recorded
            </span>
            <h2
              className="text-2xl font-bold font-serif text-gray-900 mt-1 mb-2"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              {quiz.title}
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              In accordance with strict accreditation guidelines, students are permitted exactly one (1) attempt per assessment.
            </p>

            <div className="inline-block p-6 bg-gray-50 border border-gray-200 rounded-2xl mb-8 min-w-[240px]">
              <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
                {priorAttempt.score} / {priorAttempt.total}
              </div>
              <div className="text-xs font-mono text-gray-500 mb-3">
                Score: {((priorAttempt.score / priorAttempt.total) * 100).toFixed(0)}%
              </div>
              {(priorAttempt.score / priorAttempt.total) >= 0.7 ? (
                <span className="px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold">
                  Certification Passed
                </span>
              ) : (
                <span className="px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700 rounded-full font-bold">
                  Benchmark Missed
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/scores"
                className="px-5 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors font-semibold shadow-xs"
              >
                View Assessment Scoreboard
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 text-xs font-mono uppercase tracking-wider rounded-full transition-colors"
              >
                Return to Catalogue
              </Link>
            </div>
          </div>
        )}

        {/* Phase 1: Instructions */}
        {phase === 'INSTRUCTIONS' && quiz && (
          <div className="p-8 sm:p-10 border-t-4 border-t-rose-600 border border-gray-200 bg-white rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-rose-700 text-xs font-mono uppercase tracking-widest mb-3 font-semibold">
              <ShieldAlert size={16} />
              <span>Monitored Assessment Mode</span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 tracking-tight mb-4"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              {quiz.title}
            </h1>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed border-y border-gray-100 py-6 my-6">
              <div className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">01.</span>
                <p>
                  <strong className="text-gray-900">Strict Single Attempt:</strong> Once you start, this exam cannot be paused or restarted. You are permitted exactly one attempt.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">02.</span>
                <p>
                  <strong className="text-gray-900">Anti-Cheat Tab Lock:</strong> Switching away from this browser window, opening new tabs, or minimizing will trigger an automatic immediate submission with penalties applied.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">03.</span>
                <p>
                  <strong className="text-gray-900">Passing Standard:</strong> A minimum score of <span className="text-[#00873E] font-bold">70%</span> is required to pass the institutional knowledge verification.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">04.</span>
                <p>
                  <strong className="text-gray-900">Scope:</strong> Total of <span className="font-mono text-gray-900 font-bold">{questions.length} questions</span>. All questions must be answered before submission.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/dashboard"
                className="text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel and return
              </Link>
              <button
                type="button"
                onClick={() => setPhase('TESTING')}
                className="w-full sm:w-auto px-7 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>I Understand the Rules — Begin Exam</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Active Testing */}
        {phase === 'TESTING' && questions.length > 0 && (
          <div className="border border-gray-200 bg-white rounded-2xl shadow-xs p-6 sm:p-8">
            {/* Exam Header & Progress */}
            <div className="border-b border-gray-100 pb-5 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 mb-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
                  <span>Secure Environment Active</span>
                </div>
                <h2 className="text-lg font-bold font-serif text-gray-900" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                  {quiz.title}
                </h2>
              </div>
              <div className="text-xs font-mono px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700">
                Question <span className="text-[#00873E] font-bold">{currentIdx + 1}</span> of {questions.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-8">
              <div
                className="bg-[#00873E] h-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Current Question */}
            {(() => {
              const currentQ = questions[currentIdx];
              if (!currentQ) return null;

              return (
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2 font-semibold">
                    Prompt {currentIdx + 1}
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed mb-6">
                    {currentQ.question_text}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
                    {(currentQ.options || []).map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-emerald-50 border-[#00873E] text-gray-900 shadow-xs'
                              : 'bg-gray-50/70 border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs flex-shrink-0 font-semibold ${
                              isSelected
                                ? 'border-[#00873E] bg-[#00873E] text-white'
                                : 'border-gray-300 bg-white text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="text-sm font-sans">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      className="px-4 py-2 bg-white border border-gray-200 text-xs font-mono uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-30 rounded-full transition-colors cursor-pointer"
                    >
                      Previous
                    </button>

                    {currentIdx < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                        className="px-5 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors cursor-pointer flex items-center gap-2 font-semibold shadow-xs"
                      >
                        <span>Next Question</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={submitting}
                        className="px-6 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors cursor-pointer flex items-center gap-2 font-bold disabled:opacity-50 shadow-xs"
                      >
                        {submitting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        <span>{submitting ? 'Committing Answers…' : 'Submit Final Assessment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Phase 3: Penalized (Focus lost) */}
        {phase === 'PENALIZED' && (
          <div className="p-8 sm:p-10 border border-rose-200 bg-white rounded-2xl text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={32} />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-rose-700 font-semibold">
              Exam Terminated &amp; Penalized
            </span>
            <h2
              className="text-2xl font-bold font-serif text-gray-900 mt-1 mb-2"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Focus Lost During Monitored Session
            </h2>
            <p className="text-xs text-gray-600 max-w-md mx-auto mb-6">
              {penaltyReason || 'You navigated away from the exam window. The session was automatically finalized as per anti-cheat policy.'}
            </p>

            <div className="inline-block p-6 bg-rose-50/50 border border-rose-200 rounded-2xl mb-8 min-w-[240px]">
              <div className="text-3xl font-mono font-bold text-rose-600 mb-1">
                {finalScore !== null ? finalScore : 0} / {questions.length}
              </div>
              <div className="text-xs font-mono text-gray-500 mb-3">
                Score: {questions.length > 0 ? (((finalScore || 0) / questions.length) * 100).toFixed(0) : 0}%
              </div>
              <span className="px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-rose-100 border border-rose-200 text-rose-800 rounded-full font-bold">
                Penalty Incurred
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/scores"
                className="px-5 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors font-semibold shadow-xs"
              >
                View Assessment Scoreboard
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 text-xs font-mono uppercase tracking-wider rounded-full transition-colors"
              >
                Return to Catalogue
              </Link>
            </div>
          </div>
        )}

        {/* Phase 4: Completed Naturally */}
        {phase === 'COMPLETED' && (
          <div className="p-8 sm:p-10 border border-gray-200 bg-white rounded-2xl text-center shadow-xs">
            {finalScore !== null && finalScore / questions.length >= 0.7 ? (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-[#00873E] flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} />
              </div>
            )}

            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00873E] font-semibold">
              Assessment Complete
            </span>
            <h2
              className="text-2xl font-bold font-serif text-gray-900 mt-1 mb-2"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              {quiz?.title}
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              Your results have been securely committed to the QuickHedge institutional database.
            </p>

            <div className="inline-block p-6 bg-gray-50 border border-gray-200 rounded-2xl mb-8 min-w-[240px]">
              <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
                {finalScore} / {questions.length}
              </div>
              <div className="text-xs font-mono text-gray-500 mb-3">
                Score: {questions.length > 0 ? (((finalScore || 0) / questions.length) * 100).toFixed(0) : 0}%
              </div>
              {finalScore !== null && finalScore / questions.length >= 0.7 ? (
                <span className="px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold">
                  Passed Benchmark (≥70%)
                </span>
              ) : (
                <span className="px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700 rounded-full font-bold">
                  Did Not Meet Benchmark (&lt;70%)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/scores"
                className="px-5 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors font-semibold shadow-xs"
              >
                View Assessment Scoreboard
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 text-xs font-mono uppercase tracking-wider rounded-full transition-colors"
              >
                Return to Catalogue
              </Link>
            </div>
          </div>
        )}
        {/* Modal for Upgrades */}
        <PremiumUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          plan={premiumPlan}
          materialTitle={quiz?.title}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
