import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import QuickHedgeLogo from './QuickHedgeLogo';
import { initialSettings } from '../data/initialData';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Custom icons for Socials
function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24M7.86 18.5V10.1h-2.8v8.4h2.8z"/>
    </svg>
  );
}

function YoutubeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function XIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.88-4.49v-7a8.21 8.21 0 0 0 4.89 1.6z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.877-2.056-.977-.275-.1-.475-.15-.675.15-.2.301-.775.977-.95 1.177-.175.2-.35.225-.651.075-.3-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.675-2.083-.175-.3-.019-.462.13-.612.135-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.629-.926-2.229-.244-.585-.492-.506-.676-.516l-.576-.01c-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.503 0 1.477 1.075 2.903 1.225 3.103.15.2 2.115 3.23 5.124 4.53 3.01 1.3 3.01.867 3.56.817.55-.05 1.78-.727 2.03-1.428.25-.7.25-1.3.175-1.427-.075-.125-.275-.2-.576-.35zm-5.467 7.425a9.82 9.82 0 0 1-5.011-1.373l-.36-.214-3.725.977.994-3.631-.235-.374a9.825 9.825 0 0 1-1.508-5.244c0-5.424 4.412-9.836 9.845-9.836a9.77 9.77 0 0 1 6.963 2.884 9.77 9.77 0 0 1 2.882 6.953c0 5.424-4.412 9.837-9.845 9.837zm0-17.808c-4.402 0-7.983 3.582-7.983 7.971 0 1.408.368 2.78 1.066 3.987l.166.286-.632 2.308 2.361-.619.277.164a7.95 7.95 0 0 0 4.745 1.517c4.402 0 7.983-3.582 7.983-7.971 0-4.39-3.581-7.971-7.983-7.971z" />
    </svg>
  );
}

export default function Footer() {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const getStartedHref = user ? (isAdmin ? '/admin/overview' : '/dashboard') : '/signup';
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    let isMounted = true;

    const loadLiveSettings = async () => {
      const live = await dataService.getAppSettings();
      if (isMounted && live && Object.keys(live).length > 0) {
        setSettings((prev) => ({
          ...prev,
          websiteName: live.site_name || prev.websiteName,
          tagline: live.site_tagline || prev.tagline,
          footerBlurb: live.footer_blurb || 'Curriculum study materials, human kinetics research, motor learning assessments, and sports science resources for ambitious physical education scholars and athletic educators.',
          hqLabel: live.hq_label || prev.hqLabel || 'Asaba Headquarters',
          contact: {
            phone: live.contact_phone || prev.contact.phone,
            email: live.contact_email || prev.contact.email,
            addressLines: live.contact_address
              ? live.contact_address.split('\n')
              : prev.contact.addressLines,
          },
          socialLinks: {
            instagram: live.social_instagram || prev.socialLinks.instagram,
            tiktok: live.social_tiktok || prev.socialLinks.tiktok,
            facebook: live.social_facebook || prev.socialLinks.facebook,
            x: live.social_x || prev.socialLinks.x,
            linkedin: live.social_linkedin || prev.socialLinks.linkedin,
            youtube: live.social_youtube || prev.socialLinks.youtube,
            whatsapp: live.social_whatsapp || prev.socialLinks.whatsapp,
          },
        }));
      }
    };

    loadLiveSettings();

    const channel = supabase
      .channel('footer_settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        loadLiveSettings();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const { contact, socialLinks } = settings;

  const handleLinkClick = (e, href) => {
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

  const navLinks = [
    { label: 'Thesis', href: '/#thesis' },
    { label: 'Core Philosophy', href: '/#philosophy' },
    { label: 'Executive Leadership', href: '/#team' },
    { label: 'Member Sign In', href: '/login' },
    { label: 'Create Account', href: '/signup' },
  ];

  const socials = [
    { label: 'Instagram', href: socialLinks.instagram, icon: InstagramIcon },
    { label: 'TikTok', href: socialLinks.tiktok, icon: TikTokIcon },
    { label: 'Facebook', href: socialLinks.facebook, icon: FacebookIcon },
    { label: 'X', href: socialLinks.x, icon: XIcon },
    { label: 'LinkedIn', href: socialLinks.linkedin, icon: LinkedinIcon },
    { label: 'YouTube', href: socialLinks.youtube, icon: YoutubeIcon },
    { label: 'WhatsApp', href: socialLinks.whatsapp, icon: WhatsAppIcon },
  ];


  return (
    <footer
      className="site-footer-wrapper"
      style={{
        backgroundColor: '#000000',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        width: '100%',
        paddingTop: 'clamp(4rem, 6vw, 6rem)',
        paddingBottom: 'clamp(2.5rem, 4vw, 3.5rem)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        className="site-footer-inner"
        style={{
          maxWidth: '1450px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
          width: '100%',
        }}
      >
        {/* Main Footer Multi-Column Layout */}
        <div className="site-footer-grid">
          {/* Column 1: Brand & Contact Info */}
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-block transition-opacity duration-300 hover:opacity-85"
              style={{ display: 'inline-block' }}
              aria-label="QuickHedge Home"
            >
              <QuickHedgeLogo height={32} color="#ffffff" withAccent={true} />
            </Link>

            <p className="text-[13px] text-white/50 font-light leading-relaxed max-w-sm font-sans">
              {settings.footerBlurb || 'Curriculum study materials, human kinetics research, motor learning assessments, and sports science resources for ambitious physical education scholars and athletic educators.'}
            </p>

            <div className="pt-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="block w-4 h-px bg-[#00873E]" />
                <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00873E] font-sans">
                  {settings.hqLabel || 'Asaba Headquarters'}
                </h4>
              </div>
              <div className="space-y-2 text-[13px] text-white/60 font-light leading-relaxed font-sans">
                <p>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    className="hover:text-[#00873E] transition-colors"
                  >
                    {contact.phone}
                  </a>
                </p>
                <p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-[#00873E] transition-colors"
                  >
                    {contact.email}
                  </a>
                </p>
                <p className="pt-2 text-[12px] leading-[1.8] text-white/45">
                  {contact.addressLines.map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-4 h-px bg-[#00873E]" />
              <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00873E] font-sans">
                Platform
              </h4>
            </div>

            <nav className="flex flex-col space-y-2.5" aria-label="Footer Navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="footer-nav-link"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Column 3: Social & Action */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-4 h-px bg-[#00873E]" />
                <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00873E] font-sans">
                  Connect
                </h4>
              </div>

              <p className="text-[13px] text-white/50 font-light leading-relaxed mb-4 font-sans">
                Follow our official channels for sports science research updates, human kinetics course materials, and academic announcements.
              </p>

              {/* Social Icon Grid */}
              <div className="flex flex-wrap gap-2.5 mb-8">
                {socials.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="footer-social-icon"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Footer Action Button */}
            <div className="pt-2">
              <Link
                href={getStartedHref}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all rounded-full shadow-sm"
              >
                <span>Get Started</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-white/40 uppercase tracking-[0.14em] pt-8 border-t border-white/10 font-sans"
        >
          <p>© 2026 QuickHedge Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
