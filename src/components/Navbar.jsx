import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import QuickHedgeLogo from './QuickHedgeLogo';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const getStartedHref = user ? (isAdmin ? '/admin/overview' : '/dashboard') : '/signup';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Thesis', href: '/#thesis' },
    { label: 'Philosophy', href: '/#philosophy' },
    { label: 'Leadership', href: '/#team' },
    { label: 'Intelligence', href: '/blog' },
  ];

  const handleLinkClick = (e, href) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (location === '/') {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'nav-header-scrolled' : 'nav-header-unscrolled'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-6 md:px-12">
          {/* Brand Logo - Fixed at original size */}
          <Link
            href="/"
            className="hover:opacity-85 transition-opacity duration-300 flex-shrink-0 flex items-center"
            aria-label="QuickHedge Home"
          >
            <QuickHedgeLogo
              height={28}
              color="#ffffff"
              accentColor="#00873E"
              withAccent={true}
              className="sm:h-7 md:h-8"
            />
          </Link>

          {/* Desktop Navigation Links & Action Buttons */}
          <div className="hidden lg:flex items-center">
            {/* Primary Text Navigation Links */}
            <div
              className="flex items-center"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
              }}
            >
              {navLinks.map((link) =>
                link.href.startsWith('/#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="nav-link-item"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="nav-link-item"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            {/* Visual Divider with generous spacing between links and button */}
            <div
              style={{
                width: '1px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                marginLeft: '36px',
                marginRight: '36px',
              }}
              aria-hidden="true"
            />

            {/* Action Button */}
            <div className="flex items-center">
              <Link
                href={getStartedHref}
                className="nav-btn-solid"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="lg:hidden text-white/90 hover:text-[#00873E] p-2.5 -mr-2 transition-colors cursor-pointer flex items-center justify-center rounded-sm focus:outline-none focus:ring-1 focus:ring-[#00873E]"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={26} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 bg-[#080808] z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Mobile Header Bar */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 flex justify-between items-center border-b border-white/10 bg-[#0c0c0c]">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="QuickHedge Home"
          >
            <QuickHedgeLogo
              height={26}
              color="#ffffff"
              accentColor="#00873E"
              withAccent={true}
            />
          </Link>
          <button
            type="button"
            className="p-2.5 -mr-2 text-white/80 hover:text-white transition-colors cursor-pointer rounded-sm focus:outline-none focus:ring-1 focus:ring-[#00873E]"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={26} strokeWidth={2} />
          </button>
        </div>
        <div className="flex flex-col px-6 sm:px-8 py-8 gap-8 h-full overflow-y-auto bg-[#080808] text-white justify-between">
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00873E]">
              Navigation
            </span>
            {navLinks.map((link) =>
              link.href.startsWith('/#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-white/90 hover:text-[#00873E] transition-colors text-2xl font-serif tracking-tight py-1"
                  style={{ fontFamily: '"Besley", Georgia, serif' }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/90 hover:text-[#00873E] transition-colors text-2xl font-serif tracking-tight py-1"
                  style={{ fontFamily: '"Besley", Georgia, serif' }}
                >
                  {link.label}
                </Link>
              )
            )}

          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
            <Link
              href={getStartedHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-12 inline-flex items-center justify-center bg-[#00873E] hover:bg-[#006837] text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all rounded-full shadow-lg"
            >
              Get Started
            </Link>

            <p className="text-[11px] text-white/40 text-center tracking-wider uppercase pt-2">
              Advancing Physical Education &amp; Sports Science
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
