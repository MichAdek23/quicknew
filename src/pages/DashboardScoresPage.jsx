import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  FileText,
  Video,
  Image as ImageIcon,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Award,
  BookOpen,
  Lock,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { premiumService, DEFAULT_PREMIUM_PLAN } from '../lib/premiumService';

export default function DashboardScoresPage() {
  const [, setLocation] = useLocation();
  const { user, profile } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [featuredMaterials, setFeaturedMaterials] = useState([]);
  const [premiumPlan, setPremiumPlan] = useState(DEFAULT_PREMIUM_PLAN);
  const [loading, setLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLockedMaterial, setSelectedLockedMaterial] = useState(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      // 1. Fetch user scores/attempts
      const { data: attemptData, error: attemptErr } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (
            id,
            title,
            material_id,
            materials (
              id,
              title
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (attemptErr) throw attemptErr;
      setAttempts(attemptData || []);

      // 2. Fetch the top 3 materials for the cards & plan
      const [{ data: matData, error: matErr }, planData] = await Promise.all([
        supabase
          .from('materials')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        premiumService.getPremiumPlan(),
      ]);

      if (!matErr && matData) {
        setFeaturedMaterials(matData);
      }
      if (planData) {
        setPremiumPlan(planData);
      }
    } catch (err) {
      console.warn('Error fetching scores & materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Realtime subscription for student quiz attempts, materials, and settings
    const channel = supabase
      .channel(`public:scores:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_attempts', filter: `user_id=eq.${user.id}` },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={15} className="text-rose-500" />;
      case 'image':
        return <ImageIcon size={15} className="text-amber-500" />;
      case 'pdf':
      default:
        return <FileText size={15} className="text-[#00873E]" />;
    }
  };

  return (
    <DashboardLayout title="Scores & Quizzes" showToolbar={false}>
      <div
        className="max-w-[1400px] h-full flex flex-col flex-1"
        style={{ minHeight: 'calc(100vh - 160px)' }}
      >
        {/* Section Header */}
        <div className="border-b border-gray-100 pb-5 mb-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#00873E] font-mono mb-1 font-semibold">
            <span>Performance &amp; Quizzes</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif tracking-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            Scores &amp; Quizzes
          </h1>
        </div>

        {/* First 3 Cards in Row of 3 on Desktop (without thumbnails in exact width and length) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 flex-shrink-0">
          {featuredMaterials.map((mat) => {
            const access = premiumService.checkAccess(mat.id, profile, premiumPlan);
            const hasAccess = access.hasAccess;

            return (
              <div
                key={mat.id}
                onClick={() => {
                  if (hasAccess) {
                    setLocation(`/dashboard/materials/${mat.id}`);
                  } else {
                    setSelectedLockedMaterial(mat);
                    setUpgradeModalOpen(true);
                  }
                }}
                className={`bg-white border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs transition-all duration-200 cursor-pointer group min-h-[220px] relative ${
                  hasAccess
                    ? 'border-gray-200 hover:border-[#00873E]/70 hover:shadow-md hover:-translate-y-0.5'
                    : 'border-gray-200 hover:border-amber-400/80 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1.5 font-medium">
                    <span>
                      {mat.created_at
                        ? new Date(mat.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Jun 13, 2026'}
                    </span>
                    {!hasAccess && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold">
                        <Lock size={10} />
                        <span>Premium</span>
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-base font-bold font-serif line-clamp-2 leading-snug transition-colors ${
                      hasAccess ? 'text-gray-900 group-hover:text-[#00873E]' : 'text-gray-800 group-hover:text-amber-700'
                    }`}
                    style={{ fontFamily: '"Besley", Georgia, serif' }}
                  >
                    {mat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                    {mat.description || 'Comprehensive learning materials and assessment framework.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500 group-hover:text-gray-900">
                  <span className="flex items-center gap-1.5">
                    {getTypeIcon(mat.type)}
                    <span className="capitalize">{mat.type || 'Pdf'} Asset</span>
                  </span>

                  {hasAccess ? (
                    <span className="flex items-center gap-1 text-[#00873E] font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Access</span>
                      <ChevronRight size={13} />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 font-semibold group-hover:text-amber-700">
                      <Lock size={12} />
                      <span>Unlock</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Assessment Scores Table (Always Visible Column Headings & Full Height) */}
        <div className="flex-1 flex flex-col min-h-0 pb-2">
          <div className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col min-h-[440px]">
            <div className="overflow-x-auto w-full flex-1 flex flex-col">
              <table className="w-full text-left text-xs sm:text-sm flex-1 flex flex-col h-full min-w-[700px]">
                <thead className="flex-shrink-0">
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase font-mono tracking-wider text-[11px] sm:text-xs flex w-full">
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[200px] border-r border-gray-200">Assessment Title</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[180px] border-r border-gray-200">Material</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[120px] border-r border-gray-200">Date</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[110px] border-r border-gray-200">Score</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[90px] text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 flex-1 flex flex-col relative">
                  {loading ? (
                    <tr className="flex-1 flex items-center justify-center w-full relative">
                      {/* Background Column Guide Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        <div className="flex-1 min-w-[200px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[180px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[120px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[110px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[90px]" />
                      </div>
                      <td colSpan={5} className="w-full py-16 text-center flex flex-col items-center justify-center relative z-10">
                        <div className="bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center">
                          <Loader2 size={36} className="animate-spin text-[#00873E] mb-3" />
                          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
                            Loading Personal Scores…
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : attempts.length === 0 ? (
                    <tr className="flex-1 flex items-center justify-center w-full relative">
                      {/* Background Column Guide Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        <div className="flex-1 min-w-[200px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[180px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[120px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[110px] border-r border-gray-100" />
                        <div className="flex-1 min-w-[90px]" />
                      </div>
                      <td colSpan={5} className="w-full py-16 text-center flex flex-col items-center justify-center px-4 relative z-10">
                        <div className="bg-white/95 backdrop-blur-xs p-8 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center max-w-md mx-auto">
                          <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200/90 flex items-center justify-center mb-5 text-gray-400 shadow-2xs">
                            <Award size={38} className="text-gray-400" />
                          </div>
                          <h3
                            className="text-xl sm:text-2xl font-bold text-gray-900 font-serif mb-2"
                            style={{ fontFamily: '"Besley", Georgia, serif' }}
                          >
                            No Scores Recorded
                          </h3>
                          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed text-center">
                            You have not attempted any assessments yet. Launch a knowledge check from the cards above or the material catalogue.
                          </p>
                          <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors shadow-xs"
                          >
                            <BookOpen size={14} />
                            <span>Explore All Materials</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attempts.map((attempt) => {
                      const percentage = attempt.total > 0 ? (attempt.score / attempt.total) * 100 : 0;
                      const passed = percentage >= 70;
                      const qData = attempt.quizzes || {};
                      const matData = qData.materials || null;

                      return (
                        <tr key={attempt.id} className="hover:bg-gray-50/60 transition-colors flex w-full items-center">
                          <td className="py-4.5 px-6 font-serif font-bold text-gray-900 text-sm border-r border-gray-100 flex-1 min-w-[200px]">
                            {qData.title || 'Knowledge Assessment'}
                          </td>
                          <td className="py-4.5 px-6 border-r border-gray-100 flex-1 min-w-[180px]">
                            {matData ? (
                              <Link
                                href={`/dashboard/materials/${matData.id}`}
                                className="text-xs font-mono text-[#00873E] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>{matData.title}</span>
                                <ExternalLink size={11} />
                              </Link>
                            ) : (
                              <span className="text-gray-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-4.5 px-6 font-mono text-gray-500 border-r border-gray-100 flex-1 min-w-[120px]">
                            {attempt.created_at
                              ? new Date(attempt.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-4.5 px-6 border-r border-gray-100 flex-1 min-w-[110px]">
                            <div className="font-mono text-gray-900 font-bold">
                              {attempt.score} / {attempt.total}
                            </div>
                            <div className="font-mono text-[10px] text-gray-400">
                              {percentage.toFixed(0)}%
                            </div>
                          </td>
                          <td className="py-4.5 px-6 text-right flex-1 min-w-[90px]">
                            {passed ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold">
                                <CheckCircle size={11} className="text-[#00873E]" />
                                <span>Passed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700 rounded-full font-bold">
                                <XCircle size={11} />
                                <span>Missed</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          plan={premiumPlan}
          materialTitle={selectedLockedMaterial?.title || ''}
          onSuccess={() => {
            fetchData();
          }}
        />
      </div>
    </DashboardLayout>
  );
}

