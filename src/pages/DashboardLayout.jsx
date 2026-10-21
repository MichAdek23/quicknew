import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BookOpen,
  FileCheck2,
  CreditCard,
  User,
  LogOut,
  Shield,
  Loader2,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Search,
  Sliders,
  Square,
  RotateCw,
  MoreVertical,
  HardDrive,
  CheckSquare,
  MinusSquare,
  Check,
} from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { premiumService } from '../lib/premiumService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({
  children,
  title,
  subtitle,
  showToolbar = true,
  onRefresh,
  isRefreshing = false,
  onSelectAll,
  allSelected = false,
  someSelected = false,
  totalItems,
  page = 1,
  pageSize = 50,
  onPrevPage,
  onNextPage,
  showSearch,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search materials by title or topic...',
  sortOption = 'newest',
  onSortChange,
}) {
  const [location, setLocation] = useLocation();
  const { user, profile, loading, isAdmin, isSubscribed, signOut } = useAuth();
  const userIsPremium = Boolean(isSubscribed || profile?.is_subscribed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('quickhedge_dashboard_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isHiddenSearchRoute =
    location === '/dashboard/profile' ||
    location === '/dashboard/billing' ||
    location.startsWith('/dashboard/exams') ||
    location.startsWith('/dashboard/materials/');

  const shouldShowSearch = showSearch !== undefined ? showSearch : !isHiddenSearchRoute;

  useEffect(() => {
    premiumService.getPremiumPlan().then(setPremiumPlan).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login?redirect=' + encodeURIComponent(location));
    }
  }, [user, loading, location, setLocation]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('quickhedge_dashboard_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/login');
  };

  const [materialsCount, setMaterialsCount] = useState(null);
  const [scoresCount, setScoresCount] = useState(null);

  const fetchSidebarCounts = async () => {
    try {
      const [{ count: matCount }, attemptRes] = await Promise.all([
        supabase.from('materials').select('*', { count: 'exact', head: true }).eq('is_published', true),
        user?.id
          ? supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
          : Promise.resolve({ count: 0 }),
      ]);
      if (matCount !== null && matCount !== undefined) setMaterialsCount(matCount);
      if (attemptRes && attemptRes.count !== null && attemptRes.count !== undefined) setScoresCount(attemptRes.count);
    } catch (err) {
      console.warn('Error fetching sidebar counts:', err);
    }
  };

  useEffect(() => {
    fetchSidebarCounts();

    const channel = supabase
      .channel('public:sidebar:counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchSidebarCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' }, () => {
        fetchSidebarCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const navItems = [
    {
      label: 'Materials',
      href: '/dashboard',
      icon: BookOpen,
      match: (loc) => loc === '/dashboard' || loc === '/dashboard/materials' || loc.startsWith('/dashboard/materials/'),
      count: materialsCount !== null ? String(materialsCount) : undefined,
    },
    {
      label: 'Scores & Quizzes',
      href: '/dashboard/scores',
      icon: FileCheck2,
      match: (loc) => loc === '/dashboard/scores' || loc.startsWith('/dashboard/exams'),
      count: scoresCount !== null ? String(scoresCount) : undefined,
    },
    {
      label: 'Billing & History',
      href: '/dashboard/billing',
      icon: CreditCard,
      match: (loc) => loc === '/dashboard/billing',
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      match: (loc) => loc === '/dashboard/profile',
    },
  ];

  const currentItem = navItems.find((item) => item.match(location)) || {
    label: title || 'Portal',
    href: location,
  };

  if (loading) {
    return (
      <div className="deliva-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#5E6368', fontFamily: 'monospace', fontSize: '13px' }}>
          <Loader2 size={18} className="animate-spin text-[#00873E]" />
          <span>Loading portal…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name || profile?.first_name || user.email?.split('@')[0] || 'Member';
  const effectiveSubscribed = isSubscribed || profile?.is_subscribed || isAdmin;

  return (
    <div className="deliva-shell">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (DELIVA MAIL STYLE: 64PX, FIXED, FULL WIDTH)               */}
      {/* ========================================================================= */}
      <header className="deliva-header">
        {/* Left: Single Hamburger & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Unified Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileSidebarOpen((prev) => !prev);
              } else {
                toggleSidebarCollapse();
              }
            }}
            className="deliva-icon-btn"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          {/* QuickHedge Logo */}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <QuickHedgeLogo height={26} color="#111827" accentColor="#00873E" withAccent={true} />
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#00873E',
                backgroundColor: '#D8EEDF',
                padding: '2px 8px',
                borderRadius: '9999px',
                letterSpacing: '0.05em',
              }}
              className="hidden lg:inline-block"
            >
              Portal
            </span>
          </Link>
        </div>

        {/* Center: Search & Sort Bar (Hidden on Profile, Billing, Exams, Material Details) */}
        {shouldShowSearch ? (
          <div className="hidden lg:flex flex-1 justify-center px-4">
            <div className="deliva-search-pill relative">
              <Search size={18} className="text-gray-500 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="deliva-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center mr-1 cursor-pointer transition-colors"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
              {/* Sliders / Sort button with dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen((prev) => !prev)}
                  className={`deliva-icon-btn ${sortDropdownOpen ? 'bg-gray-200' : ''}`}
                  style={{ width: '28px', height: '28px' }}
                  title="Sort materials"
                  aria-label="Sort options"
                >
                  <Sliders size={16} className="text-gray-600" />
                </button>

                {sortDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                      Sort Materials
                    </div>
                    {[
                      { key: 'newest', label: 'Newest First' },
                      { key: 'oldest', label: 'Oldest First' },
                      { key: 'title_asc', label: 'Title (A → Z)' },
                      { key: 'title_desc', label: 'Title (Z → A)' },
                      { key: 'unlocked_first', label: 'Unlocked First' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          if (onSortChange) onSortChange(opt.key);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          sortOption === opt.key ? 'text-[#00873E] font-bold bg-[#E6F4EA]/50' : 'text-gray-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortOption === opt.key && <Check size={14} className="text-[#00873E]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1" />
        )}

        {/* Right: Utilities & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Member Avatar with Google/Deliva Style Profile Dropdown Menu */}
          <HeaderProfileMenu
            user={user}
            profile={profile}
            isAdmin={isAdmin}
            isSubscribed={isSubscribed}
            displayName={displayName}
            signOut={signOut}
            profileLink="/dashboard/profile"
          />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT (FIXED SIDEBAR ON CANVAS + INDEPENDENT WHITE CARD AREA)    */}
      {/* ========================================================================= */}
      <div className="deliva-body-row">
        {/* ========================================================== */}
        {/* DESKTOP FIXED SIDEBAR (DELIVA MAIL STYLE)                  */}
        {/* ========================================================== */}
        <aside className={`deliva-sidebar hidden lg:flex ${isCollapsed ? 'is-collapsed' : ''}`}>
          {/* Deliva Pill Navigation Links */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }} aria-label="Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match(location);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`deliva-nav-item ${isActive ? 'is-active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <Icon
                      size={18}
                      className={`deliva-nav-icon flex-shrink-0 ${
                        isActive ? 'text-[#00873E]' : 'text-gray-500'
                      }`}
                    />
                    {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.count && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: isActive ? '#006837' : '#5E6368',
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Admin Link (Only for admins) */}
            {isAdmin && (
              <div style={{ paddingTop: '10px', marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Link
                  href="/admin/overview"
                  className={`deliva-nav-item ${isCollapsed ? 'collapsed' : ''}`}
                  title={isCollapsed ? 'Admin Dashboard' : undefined}
                  style={{ color: '#00873E', fontWeight: 600 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <Shield size={18} className="text-[#00873E] flex-shrink-0" />
                    {!isCollapsed && <span>Admin Dashboard</span>}
                  </div>
                </Link>
              </div>
            )}
          </nav>

          {/* Bottom Button: Manage Plan (Non-premium) or Sign Out (Premium) */}
          {!isCollapsed ? (
            <div style={{ padding: '8px 12px 12px 12px' }}>
              {!userIsPremium ? (
                <button
                  type="button"
                  onClick={() => setUpgradeModalOpen(true)}
                  style={{
                    width: '100%',
                    height: '34px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1F1F1F',
                    backgroundColor: '#F0F4F9',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  className="hover:bg-gray-200"
                >
                  <span>Manage plan</span>
                  <ExternalLink size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    height: '34px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#B3261E',
                    backgroundColor: '#FDF2F2',
                    border: '1px solid #FECDCA',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  className="hover:bg-red-100"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
              {!userIsPremium ? (
                <button
                  type="button"
                  onClick={() => setUpgradeModalOpen(true)}
                  className="deliva-icon-btn cursor-pointer"
                  title="Manage plan"
                >
                  <ExternalLink size={18} className="text-gray-600 hover:text-[#00873E]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="deliva-icon-btn cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          )}
        </aside>

        {/* ========================================================== */}
        {/* MOBILE DRAWER (SMOOTH SLIDEOUT FROM LEFT)                  */}
        {/* ========================================================== */}
        <div
          className={`fixed inset-0 z-50 flex lg:hidden transition-all duration-300 ease-in-out ${
            mobileSidebarOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
          }`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            visibility: mobileSidebarOpen ? 'visible' : 'hidden',
            opacity: mobileSidebarOpen ? 1 : 0,
            pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease, visibility 0.3s ease',
          }}
          aria-hidden={!mobileSidebarOpen}
        >
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
              mobileSidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              transition: 'opacity 0.3s ease-in-out',
            }}
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Sliding Drawer Container */}
          <div
            className={`relative w-[280px] max-w-[85vw] bg-[#F6F8FC] h-full shadow-2xl z-60 flex flex-col justify-between p-4 box-border transform transition-transform duration-300 ease-in-out ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
              position: 'relative',
              width: '280px',
              maxWidth: '85vw',
              backgroundColor: '#F6F8FC',
              height: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              boxSizing: 'border-box',
              transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <QuickHedgeLogo height={24} color="#111827" accentColor="#00873E" withAccent={true} />
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="deliva-icon-btn"
                  style={{ width: '32px', height: '32px' }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.match(location);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`deliva-nav-item ${isActive ? 'is-active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={18} className={isActive ? 'text-[#00873E]' : 'text-gray-500'} />
                        <span>{item.label}</span>
                      </div>
                      {item.count && (
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#5E6368' }}>{item.count}</span>
                      )}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <Link
                    href="/admin/overview"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="deliva-nav-item"
                    style={{ color: '#00873E', fontWeight: 600, marginTop: '8px', borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Shield size={18} className="text-[#00873E]" />
                      <span>Admin Dashboard</span>
                    </div>
                  </Link>
                )}
              </nav>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!userIsPremium ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      setUpgradeModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      height: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1F1F1F',
                      backgroundColor: '#F0F4F9',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span>Manage plan</span>
                    <ExternalLink size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      height: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#B3261E',
                      backgroundColor: '#FDF2F2',
                      border: '1px solid #FECDCA',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <LogOut size={13} />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    height: '34px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#B3261E',
                    backgroundColor: '#FDF2F2',
                    border: '1px solid #FECDCA',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN WHITE CARD CONTAINER (INDEPENDENTLY SCROLLABLE DELIVA WHITE AREA) */}
        {/* ========================================================================= */}
        <div className="deliva-main-card">
          {/* Top Card Action Bar matching Deliva Mail */}
          {showToolbar && (
            <div className="deliva-card-toolbar">
              {/* Left Action Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="deliva-icon-btn"
                  style={{ width: '32px', height: '32px' }}
                  title={allSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  aria-label={allSelected ? 'Deselect all on this page' : 'Select all on this page'}
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-[#00873E]" />
                  ) : someSelected ? (
                    <MinusSquare size={16} className="text-[#00873E]" />
                  ) : (
                    <Square size={16} className="text-gray-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onRefresh) {
                      onRefresh();
                    } else {
                      window.location.reload();
                    }
                  }}
                  disabled={isRefreshing}
                  className="deliva-icon-btn"
                  style={{ width: '32px', height: '32px' }}
                  title="Refresh materials"
                  aria-label="Refresh materials"
                >
                  <RotateCw
                    size={15}
                    className={`text-gray-600 transition-transform ${isRefreshing ? 'animate-spin text-[#00873E]' : ''}`}
                  />
                </button>

                <button type="button" className="deliva-icon-btn" style={{ width: '32px', height: '32px' }} title="More actions">
                  <MoreVertical size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Right: Pagination Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#5E6368', fontFamily: 'monospace' }}>
                  {(() => {
                    if (totalItems === undefined || totalItems === null) {
                      return '1–50';
                    }
                    if (totalItems === 0) {
                      return '0 of 0';
                    }
                    const start = (page - 1) * pageSize + 1;
                    const end = Math.min(page * pageSize, totalItems);
                    return `${start}–${end} of ${totalItems}`;
                  })()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    disabled={page <= 1 || !onPrevPage}
                    onClick={onPrevPage}
                    className="deliva-icon-btn"
                    style={{
                      width: '28px',
                      height: '28px',
                      opacity: page <= 1 || !onPrevPage ? 0.35 : 1,
                      cursor: page <= 1 || !onPrevPage ? 'not-allowed' : 'pointer',
                    }}
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} className="text-gray-500" />
                  </button>
                  <button
                    type="button"
                    disabled={totalItems !== undefined ? page * pageSize >= totalItems || !onNextPage : !onNextPage}
                    onClick={onNextPage}
                    className="deliva-icon-btn"
                    style={{
                      width: '28px',
                      height: '28px',
                      opacity:
                        (totalItems !== undefined && page * pageSize >= totalItems) || !onNextPage
                          ? 0.35
                          : 1,
                      cursor:
                        (totalItems !== undefined && page * pageSize >= totalItems) || !onNextPage
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                    title="Next page"
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pure White Scrollable Viewport: INDEPENDENT SCROLL */}
          <main className="deliva-scroll-viewport">
            {children}
          </main>
        </div>
      </div>

      {/* Global Manage Plan / Premium Modal */}
      <PremiumUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        plan={premiumPlan}
      />
    </div>
  );
}
