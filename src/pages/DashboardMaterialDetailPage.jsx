import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import {
  ArrowLeft,
  FileText,
  Video,
  Image as ImageIcon,
  Lock,
  ArrowRight,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import SecurePdfViewer from '../components/SecurePdfViewer';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { premiumService, DEFAULT_PREMIUM_PLAN } from '../lib/premiumService';
import { usePageSeo } from '../lib/usePageSeo';

export default function DashboardMaterialDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, profile, isAdmin, isSubscribed } = useAuth();
  const [material, setMaterial] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [premiumPlan, setPremiumPlan] = useState(DEFAULT_PREMIUM_PLAN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  usePageSeo({
    title: material ? material.title : 'Study Material & Academic Guide',
    description: material ? (material.description || `Study ${material.title} curriculum resources on QuickHedge Inc.`) : 'Physical education and sports science academic resources.',
    canonicalPath: `/dashboard/materials/${id || ''}`,
  });

  const access = premiumService.checkAccess(id, profile, premiumPlan);
  const hasAccess = access.hasAccess;

  useEffect(() => {
    const fetchMaterialData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        // 1. Fetch Material & Plan
        const [{ data: matData, error: matErr }, planData] = await Promise.all([
          supabase
            .from('materials')
            .select('*')
            .eq('id', id)
            .eq('is_published', true)
            .single(),
          premiumService.getPremiumPlan(),
        ]);

        if (planData) setPremiumPlan(planData);

        if (matErr || !matData) {
          setError('The requested document does not exist or has been archived.');
          setLoading(false);
          return;
        }

        setMaterial(matData);

        // 2. Fetch associated Quizzes
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('*, quiz_questions(*)')
          .eq('material_id', id);

        setQuizzes(quizData || []);
      } catch (err) {
        console.error('Error loading material details:', err);
        setError('Failed to query repository.');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialData();

    // Realtime listener for this material and associated quizzes
    const channel = supabase
      .channel(`public:material:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials', filter: `id=eq.${id}` },
        () => {
          fetchMaterialData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes', filter: `material_id=eq.${id}` },
        () => {
          fetchMaterialData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Document Viewer">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <Loader2 size={32} className="animate-spin text-[#00873E] mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Querying Secure Repository…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !material) {
    return (
      <DashboardLayout title="Document Not Found">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="p-8 border border-red-200 bg-red-50/50 rounded-2xl">
            <AlertTriangle size={36} className="text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-serif text-gray-900 mb-2" style={{ fontFamily: '"Besley", Georgia, serif' }}>
              Material Unavailable
            </h2>
            <p className="text-xs text-gray-600 mb-6">{error || 'Resource not found.'}</p>
            <Link
              href="/dashboard/materials"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-xs font-mono uppercase tracking-wider text-gray-800 hover:border-[#00873E] hover:text-[#00873E] transition-colors rounded-full shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Return to Catalogue</span>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={material.title}>
      <div className="mx-auto max-w-5xl pb-12">
        {/* Material Header */}
        <div className="border-b border-gray-100 pb-6 mb-8">
          {material.created_at && (
            <div className="text-xs font-mono text-gray-400 mb-3">
              {new Date(material.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-serif tracking-tight leading-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            {material.title}
          </h1>

          {material.description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-3xl">
              {material.description}
            </p>
          )}
        </div>

        {/* Content Section: Subscribed vs Gated */}
        {hasAccess && material.url ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs mb-12">
            {material.type === 'video' ? (
              <div className="relative bg-black w-full flex items-center justify-center">
                <video
                  src={material.url}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  className="w-full max-h-[650px] aspect-video object-contain"
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>
            ) : material.type === 'image' ? (
              <div className="p-4 bg-gray-50 flex items-center justify-center">
                <img
                  src={material.url}
                  alt={material.title}
                  className="max-w-full max-h-[800px] object-contain rounded-xl"
                />
              </div>
            ) : material.type === 'pdf' ? (
              <SecurePdfViewer url={material.url} title={material.title} />
            ) : (
              <iframe
                src={material.url}
                title={material.title}
                className="w-full h-[800px] border-0"
              />
            )}
          </div>
        ) : (
          /* Subscription Gate */
          <div className="relative overflow-hidden p-8 sm:p-12 border border-[#C2E7D0] bg-gradient-to-b from-[#E6F4EA]/40 via-white to-white rounded-2xl text-center mb-12 shadow-xs">
            <div className="max-w-md mx-auto relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#E6F4EA] border border-[#C2E7D0] text-[#00873E] flex items-center justify-center mb-4 shadow-xs">
                <Lock size={26} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00873E] font-semibold mb-2">
                Premium Content Locked
              </span>
              <h2
                className="text-2xl font-bold font-serif text-gray-900 mb-2"
                style={{ fontFamily: '"Besley", Georgia, serif' }}
              >
                Access Requires Active Subscription
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                This learning material and its associated tests are reserved exclusively for active Premium members. Unlock full access for {premiumPlan.duration_days} days.
              </p>
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-[#C2E7D0] rounded-full text-xs font-mono font-bold text-gray-900 shadow-2xs">
                <span>Pass Fee: ₦{Number(premiumPlan.price_ngn || 0).toLocaleString()}</span>
                <span>•</span>
                <span className="text-[#00873E]">{premiumPlan.duration_days} Days Validity</span>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="px-6 py-3 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-colors flex items-center gap-2 shadow-xs cursor-pointer font-mono"
              >
                <span>Unlock with Premium Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Associated Assessments Section */}
        {quizzes && quizzes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00873E] mb-2 font-semibold">
              <Award size={14} />
              <span>Mandatory Knowledge Verification</span>
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold text-gray-900 font-serif mb-6"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Knowledge Assessments Available
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => {
                const questionCount = quiz.quiz_questions?.length || 0;
                return (
                  <div
                    key={quiz.id}
                    className="p-6 bg-white border border-gray-200 hover:border-[#00873E]/50 rounded-2xl transition-colors flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-2">
                        <span>Strict Testing Mode</span>
                        <span>{questionCount} Questions</span>
                      </div>
                      <h3
                        className="text-base font-bold text-gray-900 font-serif mb-2"
                        style={{ fontFamily: '"Besley", Georgia, serif' }}
                      >
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Single-attempt assessment. Anti-cheat monitors active tab focus. 70% required to earn passing certification.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      {hasAccess ? (
                        <Link
                          href={`/dashboard/exams/${quiz.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-mono uppercase tracking-wider rounded-full transition-colors font-semibold shadow-xs"
                        >
                          <span>Begin Assessment</span>
                          <ChevronRight size={14} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUpgradeModalOpen(true)}
                          className="w-full flex items-center justify-between text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full cursor-pointer hover:bg-amber-100/70 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Lock size={12} />
                            <span>Premium Required</span>
                          </span>
                          <span className="font-bold text-[#00873E] underline">
                            Unlock
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          plan={premiumPlan}
          materialTitle={material.title}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
