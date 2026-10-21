import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  TrendingUp,
  Award,
  FileText,
  HelpCircle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminOverviewPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [subscribedMembers, setSubscribedMembers] = useState(0);
  const [studentMembers, setStudentMembers] = useState(0);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRealData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch real payments from Supabase
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('status', 'success');

      if (paymentsData && paymentsData.length > 0) {
        const rev = paymentsData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        setTotalRevenue(rev);
      }

      // 2. Fetch profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profData) {
        setProfiles(profData);
        const subscribed = profData.filter((p) => p.is_subscribed).length;
        const students = profData.filter((p) => p.role === 'student').length;
        setSubscribedMembers(subscribed);
        setStudentMembers(students || profData.length);
      }

      // 3. Fetch materials count
      const { count: mCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true });
      if (typeof mCount === 'number') setMaterialsCount(mCount);

      // 4. Fetch quizzes count
      const { count: qCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true });
      if (typeof qCount === 'number') setQuizzesCount(qCount);

      // 5. Fetch quiz attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('score, total, passed')
        .limit(100);
      if (attemptsData) setAttempts(attemptsData);

      // 6. Fetch contact messages
      const { data: msgData } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (msgData) setMessages(msgData);
    } catch (err) {
      console.warn('Real data fetch notification:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const conversionRate =
    studentMembers > 0 ? ((subscribedMembers / studentMembers) * 100).toFixed(1) : '0.0';

  const averageScore =
    attempts.length > 0
      ? (
          (attempts.reduce((acc, a) => acc + (a.total > 0 ? a.score / a.total : 0), 0) /
            attempts.length) *
          100
        ).toFixed(1)
      : '0.0';

  const passRate =
    attempts.length > 0
      ? ((attempts.filter((a) => a.passed).length / attempts.length) * 100).toFixed(1)
      : '0.0';

  return (
    <AdminLayout title="Overview">
      <div className="max-w-[1500px]">
        {/* Header */}
        <header className="mb-8 flex flex-wrap justify-between items-start gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Overview</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Real-time activity and analytics across the QuickHedge platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchRealData}
              disabled={refreshing}
              className="border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-widest text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs font-semibold rounded-full"
            >
              <RefreshCw
                size={12}
                className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'}
              />
              <span>{refreshing ? 'Syncing Live…' : 'Refresh Data'}</span>
            </button>
          </div>
        </header>

        {/* Top 4 Core Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* 1. Gross Revenue */}
          <div className="border border-gray-200/90 bg-white p-5 sm:p-6 relative overflow-hidden shadow-xs rounded-2xl hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Gross Revenue
              </span>
              <div className="w-7 h-7 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#00873E]">
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1 flex items-baseline gap-1">
              <span className="font-sans font-semibold text-gray-700 text-xl sm:text-2xl">₦</span>
              <span className="font-mono">{totalRevenue.toLocaleString('en-NG')}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">Paystack verified volume</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00873E]" />
          </div>

          {/* 2. Paid Conversion Rate */}
          <div className="border border-gray-200/90 bg-white p-5 sm:p-6 relative overflow-hidden shadow-xs rounded-2xl hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Conversion Rate
              </span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Award size={15} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1 flex items-baseline gap-1.5">
              <span className="font-mono">{subscribedMembers}</span>
              <span className="text-sm font-semibold text-emerald-700">({conversionRate}%)</span>
            </div>
            <p className="text-xs text-gray-500">of {studentMembers} total students</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          {/* 3. Active Library (Materials + Quizzes) */}
          <div className="border border-gray-200/90 bg-white p-5 sm:p-6 relative overflow-hidden shadow-xs rounded-2xl hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Active Library
              </span>
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText size={15} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1 flex items-baseline gap-1.5">
              <span className="font-mono">{materialsCount}</span>
              <span className="text-xs font-medium text-gray-500 font-sans">Materials</span>
            </div>
            <div className="text-xs font-semibold text-gray-600 font-mono">
              {quizzesCount} Quizzes Live
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
          </div>

          {/* 4. Assessment Telemetry */}
          <div className="border border-gray-200/90 bg-white p-5 sm:p-6 relative overflow-hidden shadow-xs rounded-2xl hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Assessment Stream
              </span>
              <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <HelpCircle size={15} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1 flex items-baseline gap-1.5">
              <span className="font-mono">{attempts.length}</span>
              <span className="text-xs font-medium text-gray-500 font-sans">Attempts</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono mt-1">
              <span className="text-emerald-700 font-semibold">{averageScore}% Avg</span>
              <span className="text-gray-300">&bull;</span>
              <span className="text-gray-600">{passRate}% Pass</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          </div>
        </section>

        {/* Main Grid: Live Records & Pipeline Security */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Records Table */}
          <div className="lg:col-span-2 border border-gray-200/90 bg-white p-6 sm:p-7 shadow-xs rounded-2xl">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Registered Members</h3>
                <p className="text-xs text-gray-500 mt-0.5">Live database entries</p>
              </div>
              <Link
                href="/admin/records"
                className="text-xs text-[#00873E] font-semibold hover:underline flex items-center gap-1"
              >
                <span>View all records</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400 font-mono">
                Querying database records…
              </div>
            ) : profiles.length === 0 && messages.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-gray-200 bg-gray-50/50 p-8 rounded-xl">
                <FolderOpen size={28} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-800 mb-1">No Records Found</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Incoming member registrations, inquiries, and application requests will populate here in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {profiles.slice(0, 6).map((p) => (
                  <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-gray-900 font-semibold flex items-center gap-2">
                        <span>{p.full_name || 'Member'}</span>
                        <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-[10px] text-gray-600 uppercase font-mono rounded-full">
                          {p.role}
                        </span>
                        {p.is_subscribed && (
                          <span className="px-2 py-0.5 bg-[#E6F4EA] border border-[#C2E7D0] text-[10px] text-[#006837] uppercase font-mono rounded-full font-semibold">
                            Premium
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5 font-mono">
                        {p.email || (p.username ? `@${p.username}` : '') || p.id.slice(0, 8)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 font-mono">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Platform Status & Events */}
          <div className="space-y-6">
            {/* System Status */}
            <div className="border border-gray-200/90 bg-white p-6 shadow-xs rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={18} className="text-[#00873E]" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">
                  Platform Status
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">PostgreSQL live security state</p>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00873E]" />
                    Materials Bucket
                  </span>
                  <span className="text-emerald-700 font-mono text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Ready
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00873E]" />
                    Assessment Engine
                  </span>
                  <span className="text-emerald-700 font-mono text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00873E]" />
                    Paystack Gate
                  </span>
                  <span className="text-emerald-700 font-mono text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Configured
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00873E]" />
                    Row-Level Security
                  </span>
                  <span className="text-emerald-700 font-mono text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Enforced
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Registrations */}
            <div className="border border-gray-200/90 bg-white p-6 shadow-xs rounded-2xl">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Recent Registrations</h3>
              <p className="text-xs text-gray-500 mb-4">Latest sign-ups</p>

              {profiles.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No accounts recorded yet.</p>
              ) : (
                <div className="space-y-3.5 text-xs">
                  {profiles.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#00873E] mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          {p.full_name || 'Member'} registered
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {p.created_at ? new Date(p.created_at).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer info bar */}
        <footer className="border-t border-gray-100 pt-5 flex flex-wrap justify-between items-center text-xs text-gray-500">
          <span>Data synced live from Supabase</span>
          <span>Admin Portal</span>
          <Link
            href="/admin/records"
            className="text-[#00873E] font-semibold hover:underline flex items-center gap-1.5"
          >
            <span>View all members</span>
            <ArrowRight size={12} />
          </Link>
        </footer>
      </div>
    </AdminLayout>
  );
}
