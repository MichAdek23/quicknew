import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  BookOpen,
  FileText,
  Video,
  Image as ImageIcon,
  Lock,
  ChevronRight,
  Check,
  Search,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import MaterialThumbnail from '../components/MaterialThumbnail';
import MaterialCardSkeleton from '../components/MaterialCardSkeleton';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { premiumService, DEFAULT_PREMIUM_PLAN } from '../lib/premiumService';
import { usePageSeo } from '../lib/usePageSeo';

const PAGE_SIZE = 50;

export default function DashboardMaterialsPage() {
  usePageSeo({
    title: 'Physical Education Study Materials & Curriculum Library',
    description: 'Explore comprehensive physical education study guides, motor learning research, sports psychology texts, and athletic training manuals.',
    canonicalPath: '/dashboard/materials',
  });

  const [, setLocation] = useLocation();
  const { isSubscribed, profile, isAdmin } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [premiumPlan, setPremiumPlan] = useState(DEFAULT_PREMIUM_PLAN);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLockedMaterial, setSelectedLockedMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const effectiveSubscribed = isSubscribed || profile?.is_subscribed || isAdmin;

  const fetchMaterials = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [{ data, error }, planData] = await Promise.all([
        supabase
          .from('materials')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        premiumService.getPremiumPlan(),
      ]);

      if (error) throw error;
      setMaterials(data || []);
      if (planData) setPremiumPlan(planData);
    } catch (err) {
      console.warn('Error loading materials & plan:', err);
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMaterials(false);

    // Supabase Realtime for materials and premium settings
    const channel = supabase
      .channel('public:materials:catalogue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => {
          fetchMaterials(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        () => {
          fetchMaterials(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort materials
  const filteredAndSortedMaterials = useMemo(() => {
    let list = [...materials];

    // Search query filter across title, description, and type
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((mat) => {
        const titleMatch = mat.title?.toLowerCase().includes(q);
        const descMatch = mat.description?.toLowerCase().includes(q);
        const typeMatch = mat.type?.toLowerCase().includes(q);
        return titleMatch || descMatch || typeMatch;
      });
    }

    // Sort order
    list.sort((a, b) => {
      if (sortOption === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortOption === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortOption === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (sortOption === 'unlocked_first') {
        const accessA = premiumService.checkAccess(a.id, profile, premiumPlan).hasAccess ? 1 : 0;
        const accessB = premiumService.checkAccess(b.id, profile, premiumPlan).hasAccess ? 1 : 0;
        if (accessA !== accessB) {
          return accessB - accessA;
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      // default: newest
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return list;
  }, [materials, searchQuery, sortOption, profile, premiumPlan]);

  const totalPages = Math.ceil(filteredAndSortedMaterials.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredAndSortedMaterials.length);
  const displayedMaterials = filteredAndSortedMaterials.slice(startIndex, endIndex);

  // Keep currentPage valid if materials list changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const currentPageIds = displayedMaterials.map((m) => m.id);
  const allPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    currentPageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleItem = (e, id) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handleRefresh = () => {
    fetchMaterials(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={16} className="text-rose-500" />;
      case 'image':
        return <ImageIcon size={16} className="text-amber-500" />;
      case 'pdf':
      default:
        return <FileText size={16} className="text-[#00873E]" />;
    }
  };

  return (
    <DashboardLayout
      title="Material Catalogue"
      showSearch={true}
      searchQuery={searchQuery}
      onSearchChange={(val) => {
        setSearchQuery(val);
        setCurrentPage(1);
      }}
      searchPlaceholder="Search materials by title or topic..."
      sortOption={sortOption}
      onSortChange={(opt) => {
        setSortOption(opt);
        setCurrentPage(1);
      }}
      onRefresh={handleRefresh}
      isRefreshing={refreshing}
      onSelectAll={handleToggleSelectAll}
      allSelected={allPageSelected}
      someSelected={somePageSelected}
      totalItems={filteredAndSortedMaterials.length}
      page={currentPage}
      pageSize={PAGE_SIZE}
      onPrevPage={handlePrevPage}
      onNextPage={handleNextPage}
    >
      <div className="max-w-[1400px]">
        {/* Materials Grid: Direct Content Only */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <MaterialCardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredAndSortedMaterials.length === 0 ? (
          searchQuery ? (
            <div className="p-16 text-center border border-gray-200 bg-gray-50/50 rounded-2xl">
              <Search size={36} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-900 font-serif mb-1" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                No Materials Found Matching "{searchQuery}"
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Try checking for typos or clear your search query to view all available materials.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F0F4F9] hover:bg-[#E2E8F0] text-gray-800 text-xs font-semibold rounded-full border border-gray-200 cursor-pointer transition-colors"
              >
                <span>Clear search query</span>
              </button>
            </div>
          ) : (
            <div className="p-16 text-center border border-gray-200 bg-gray-50/50 rounded-2xl">
              <BookOpen size={36} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-900 font-serif mb-1" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                No Materials Found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                The curriculum library is currently being curated.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedMaterials.map((mat) => {
              const isSelected = selectedIds.has(mat.id);
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
                  className={`group bg-white border transition-all duration-200 rounded-2xl overflow-hidden flex flex-col cursor-pointer shadow-xs relative ${
                    isSelected
                      ? 'border-[#00873E] ring-2 ring-[#00873E]/30'
                      : hasAccess
                      ? 'border-gray-200 hover:border-[#00873E]/70 hover:shadow-md hover:-translate-y-0.5'
                      : 'border-gray-200 hover:border-amber-400/80 hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail / Header */}
                  <div className="relative h-[352px] w-full bg-[#001e2b] overflow-hidden border-b border-gray-100 flex items-center justify-center">
                    <MaterialThumbnail mat={mat} />

                    {/* Card Checkbox Pill */}
                    <div
                      className="absolute top-3 left-3 z-20"
                      onClick={(e) => handleToggleItem(e, mat.id)}
                    >
                      <button
                        type="button"
                        aria-label={isSelected ? 'Deselect material' : 'Select material'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#00873E] text-white shadow-sm ring-2 ring-white'
                            : 'bg-white/85 backdrop-blur-xs text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-300/80 shadow-2xs'
                        }`}
                      >
                        {isSelected ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <span className="w-3 h-3 rounded-xs border border-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Lock Indicator for non-subscribed */}
                    {!hasAccess && (
                      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-amber-500/95 backdrop-blur-md rounded-full border border-amber-400/80 text-white shadow-xs pointer-events-none flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                        <Lock size={11} strokeWidth={2.5} />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 mb-1">
                        {mat.created_at ? new Date(mat.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </div>
                      <h3
                        className={`text-base font-bold font-serif line-clamp-2 transition-colors ${
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
                        <span className="capitalize">{mat.type} Asset</span>
                      </span>

                      {hasAccess ? (
                        <span className="flex items-center gap-1 text-[#00873E] font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Access</span>
                          <ChevronRight size={13} />
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 font-semibold group-hover:text-amber-700">
                          <Lock size={12} />
                          <span>Unlock with Premium</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          plan={premiumPlan}
          materialTitle={selectedLockedMaterial?.title || ''}
          onSuccess={() => {
            fetchMaterials(true);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
