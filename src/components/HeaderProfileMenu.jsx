import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Sun,
  Moon,
  Monitor,
  Copy,
  Check,
  ShieldCheck,
  User,
  LogOut,
  UserPlus,
} from 'lucide-react';

export default function HeaderProfileMenu({
  user,
  profile,
  isAdmin = false,
  isSubscribed = false,
  displayName,
  signOut,
  profileLink = '/dashboard/profile',
}) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  // Theme state: 'light' | 'dark' | 'system', default is 'light'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('quickhedge_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme to document
  const applyTheme = (targetTheme) => {
    const root = document.documentElement;
    let effective = targetTheme;
    if (targetTheme === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effective = isDark ? 'dark' : 'light';
    }

    if (effective === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    try {
      localStorage.setItem('quickhedge_theme', targetTheme);
    } catch {}
    setTheme(targetTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    if (signOut) {
      await signOut();
    }
    setLocation('/login');
  };

  const emailDisplay = user?.email || 'member@quick-hedgeconsulting.com';
  const nameDisplay = displayName || profile?.full_name || 'Member';
  const initial = (nameDisplay.charAt(0) || 'M').toUpperCase();

  return (
    <div className="relative inline-block" ref={menuRef} style={{ position: 'relative' }}>
      {/* 1. Header Trigger Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="deliva-avatar"
        title={`${nameDisplay} (${emailDisplay})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          overflow: 'hidden',
          padding: 0,
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px #00873E' : '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={nameDisplay}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{initial}</span>
        )}
      </button>

      {/* 2. Google / Deliva Style Profile Popover Menu */}
      {isOpen && (
        <div
          className="header-profile-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '320px',
            maxWidth: 'calc(100vw - 24px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 12px 36px -6px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '24px 20px 18px 20px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
            fontFamily: '"NeueHaas", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#1F1F1F',
            animation: 'delivaFadeIn 0.18s ease-out',
          }}
        >
          {/* Big Profile Avatar */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginBottom: '12px',
              backgroundColor: '#1657D9',
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #185ABC 0%, #0D47A1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              flexShrink: 0,
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={nameDisplay}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
                {initial}
              </span>
            )}
          </div>

          {/* User Full Name */}
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: '17px',
              fontWeight: 600,
              color: '#1F1F1F',
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            {nameDisplay}
          </h3>

          {/* User Email with Copy Icon Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
              color: '#5E6368',
              fontSize: '13px',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '210px' }}>
              {emailDisplay}
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              title={copied ? 'Copied!' : 'Copy email address'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: copied ? '#E6F4EA' : 'transparent',
                color: copied ? '#00873E' : '#5E6368',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          {/* Membership Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: '#EBF7EE',
              color: '#00873E',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={14} className="text-[#00873E]" />
            <span>
              {isAdmin ? 'Administrator' : isSubscribed ? 'Active Premium Member' : 'Active Member'}
            </span>
          </div>

          {/* Theme Selector Box: Icons only, Light theme default */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#F8F9FA',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: '10px 12px',
              marginBottom: '14px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E8EAED',
                borderRadius: '12px',
                padding: '3px',
                gap: '4px',
              }}
            >
              {/* Light Theme Button (Default) */}
              <button
                type="button"
                onClick={() => applyTheme('light')}
                title="Light theme"
                aria-label="Light theme"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '34px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : 'transparent',
                  color: theme === 'light' ? '#00873E' : '#5F6368',
                  boxShadow: theme === 'light' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sun size={17} />
              </button>

              {/* Dark Theme Button */}
              <button
                type="button"
                onClick={() => applyTheme('dark')}
                title="Dark theme"
                aria-label="Dark theme"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '34px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: theme === 'dark' ? '#FFFFFF' : 'transparent',
                  color: theme === 'dark' ? '#00873E' : '#5F6368',
                  boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Moon size={17} />
              </button>

              {/* System Default Theme Button */}
              <button
                type="button"
                onClick={() => applyTheme('system')}
                title="System default"
                aria-label="System default"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '34px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: theme === 'system' ? '#FFFFFF' : 'transparent',
                  color: theme === 'system' ? '#00873E' : '#5F6368',
                  boxShadow: theme === 'system' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Monitor size={17} />
              </button>
            </div>
          </div>

          {/* Action Link: Manage Profile / Account */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setLocation(profileLink);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 14px',
              marginBottom: '10px',
              border: '1px solid #DADCE0',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              color: '#3C4043',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
            className="hover:bg-gray-50 hover:border-gray-400"
          >
            <User size={15} className="text-gray-500" />
            <span>Manage Profile & Account</span>
          </button>

          {/* Sign Out Button (Styled identically to screenshot) */}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              border: '1px solid #FECDCA',
              borderRadius: '9999px',
              backgroundColor: '#FDF2F2',
              color: '#B3261E',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-red-100 hover:border-red-300"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
