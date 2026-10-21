import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BarChart3,
  Users,
  MessageSquare,
  Sliders,
  UserCheck,
  PlaySquare,
  CreditCard,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  FileCheck2,
  FileText,
  Search,
  Plus,
  HelpCircle,
  Settings,
  Square,
  RotateCw,
  MoreVertical,
  HardDrive,
  Shield,
  ShieldCheck,
  CheckSquare,
  MinusSquare,
} from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({
  children,
  title,
  subtitle,
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
}) {
  const [location, setLocation] = useLocation();
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('quickhedge_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation('/admin/sign-in');
      } else if (!isAdmin) {
        setLocation('/admin/sign-in?denied=true');
      }
    }
  }, [user, isAdmin, loading, setLocation]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('quickhedge_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/admin/sign-in');
  };

  const navGroups = [
    {
      group: 'Dashboard',
      items: [
        {
          label: 'Overview',
          href: '/admin/overview',
          icon: BarChart3,
          match: (loc) => loc === '/admin/overview' || loc === '/admin',
        },
        {
          label: 'Members',
          href: '/admin/records',
          icon: Users,
          match: (loc) => loc === '/admin/records' || loc.startsWith('/admin/applications'),
        },
        {
          label: 'Inquiries',
          href: '/admin/inquiries',
          icon: MessageSquare,
          match: (loc) => loc === '/admin/inquiries',
        },
      ],
    },
    {
      group: 'Academy',
      items: [
        {
          label: 'Materials',
          href: '/admin/materials',
          icon: FolderOpen,
          match: (loc) => loc === '/admin/materials',
        },
        {
          label: 'Quizzes',
          href: '/admin/quizzes',
          icon: FileCheck2,
          match: (loc) => loc === '/admin/quizzes',
        },
        {
          label: 'Premium Access',
          href: '/admin/premium-plans',
          icon: ShieldCheck,
          match: (loc) => loc === '/admin/premium-plans' || loc === '/admin/premium',
        },
        {
          label: 'Blog',
          href: '/admin/blog',
          icon: FileText,
          match: (loc) => loc === '/admin/blog',
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          label: 'Settings',
          href: '/admin/website-settings',
          icon: Sliders,
          match: (loc) => loc === '/admin/website-settings',
        },
        {
          label: 'Team',
          href: '/admin/team',
          icon: UserCheck,
          match: (loc) => loc === '/admin/team',
        },
        {
          label: 'Videos',
          href: '/admin/videos',
          icon: PlaySquare,
          match: (loc) => loc === '/admin/videos',
        },
        {
          label: 'Payments',
          href: '/admin/payments',
          icon: CreditCard,
          match: (loc) => loc === '/admin/payments',
        },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap((g) => g.items);
  const currentItem =
    allNavItems.find((item) => item.match(location)) || {
      label: title || 'Admin',
      href: location,
    };

  if (loading) {
    return (
      <div className="deliva-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#5E6368', fontFamily: 'monospace', fontSize: '13px' }}>
          <Loader2 size={18} className="animate-spin text-[#00873E]" />
          <span>Verifying credentials…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="deliva-shell" style={{ alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #FECDCA', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3F2', border: '1px solid #FECDCA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#D92D20' }}>
            <ShieldAlert size={24} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px', fontFamily: '"Besley", Georgia, serif' }}>
            Access Restricted
          </h1>
          <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '24px', lineHeight: 1.5 }}>
            Admin authorization required. The account <span style={{ fontWeight: 600, color: '#111827' }}>({user.email})</span> does not have executive privileges.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                backgroundColor: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '9999px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
            <Link
              href="/"
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#00873E',
                borderRadius: '9999px',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminName = profile?.full_name || profile?.first_name || user?.user_metadata?.full_name || 'Admin';
  const adminEmail = user?.email || 'admin@quick-hedgeconsulting.com';

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
          <Link href="/admin/overview" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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
              Admin
            </span>
          </Link>
        </div>

        {/* Center: Deliva-style Search Bar */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <div className="deliva-search-pill">
            <Search size={18} className="text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search ${currentItem.label.toLowerCase()}...`}
              className="deliva-search-input"
            />
            <button type="button" className="deliva-icon-btn" style={{ width: '28px', height: '28px' }} title="Search options">
              <Sliders size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Right: Settings, Help & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/admin/website-settings"
            className="deliva-icon-btn hidden lg:flex"
            title="Platform Settings"
          >
            <Settings size={18} />
          </Link>

          {/* Help & Support */}
          <a
            href="mailto:support@quick-hedgeconsulting.com?subject=QuickHedge%20Admin%20Support"
            className="deliva-icon-btn hidden lg:inline-flex"
            title="Help & Support"
            aria-label="Help & Support"
          >
            <HelpCircle size={18} />
          </a>

          {/* Admin Avatar with Google/Deliva Style Profile Dropdown Menu */}
          <HeaderProfileMenu
            user={user}
            profile={profile}
            isAdmin={true}
            isSubscribed={true}
            displayName={adminName}
            signOut={signOut}
            profileLink="/admin/overview"
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
          {/* Top Quick Action Button */}
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <Link
              href="/admin/materials"
              className={`deliva-compose-btn ${isCollapsed ? 'collapsed' : ''}`}
              title="Add Material"
            >
              <Plus size={18} className="text-[#00873E] flex-shrink-0" />
              {!isCollapsed && <span>Quick Action</span>}
            </Link>
          </div>

          {/* Navigation Groups with Deliva-style Rounded Pills */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }} aria-label="Sidebar Navigation">
            {navGroups.map((group) => (
              <div key={group.group}>
                {!isCollapsed && (
                  <div style={{ padding: '0 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600 }}>
                    {group.group}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {group.items.map((item) => {
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
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Sign Out */}
          {!isCollapsed ? (
            <div style={{ padding: '8px 12px 12px 12px' }}>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#B3261E',
                  backgroundColor: '#FDF2F2',
                  border: '1px solid #FECDCA',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover:bg-red-100/70"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={handleSignOut}
                className="deliva-icon-btn"
                title="Sign Out"
              >
                <LogOut size={18} className="text-gray-600 hover:text-red-600" />
              </button>
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

              <nav style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '70vh' }}>
                {navGroups.map((group) => (
                  <div key={group.group}>
                    <div style={{ padding: '0 12px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600 }}>
                      {group.group}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {group.items.map((item) => {
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
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#B3261E',
                  backgroundColor: '#FDF2F2',
                  border: '1px solid #FECDCA',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN WHITE CARD CONTAINER (INDEPENDENTLY SCROLLABLE DELIVA WHITE AREA) */}
        {/* ========================================================================= */}
        <div className="deliva-main-card">
          {/* Top Card Action Bar matching Deliva Mail */}
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
                title="Refresh"
                aria-label="Refresh"
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

            {/* Right: Pagination Controls & Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#5E6368', fontFamily: 'monospace' }}>
                {(() => {
                  if (totalItems !== undefined && totalItems !== null) {
                    if (totalItems === 0) return '0 of 0';
                    const start = (page - 1) * pageSize + 1;
                    const end = Math.min(page * pageSize, totalItems);
                    return `${start}–${end} of ${totalItems}`;
                  }
                  return currentItem.label;
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

          {/* Pure White Scrollable Viewport: INDEPENDENT SCROLL */}
          <main className="deliva-scroll-viewport">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
