import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { initialSiteCtas } from '../data/initialData';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CtaButtons({ placement, className = '', onNavigate }) {
  const { user, isAdmin } = useAuth();
  const dashboardHref = isAdmin ? '/admin/overview' : '/dashboard';
  const [ctas, setCtas] = useState(initialSiteCtas.items);
  const [enabled, setEnabled] = useState(initialSiteCtas.enabled);

  useEffect(() => {
    let isMounted = true;

    const loadLiveCtas = async () => {
      const [liveCtas, settings] = await Promise.all([
        dataService.getSiteCtas(),
        dataService.getAppSettings(),
      ]);

      if (isMounted) {
        if (liveCtas && liveCtas.length > 0) {
          setCtas(liveCtas);
        }
        if (settings && settings.ctas_enabled !== undefined) {
          setEnabled(settings.ctas_enabled === 'true');
        }
      }
    };

    loadLiveCtas();

    const channel = supabase
      .channel('site_ctas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_ctas' }, () => {
        loadLiveCtas();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        loadLiveCtas();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const activeCtas = enabled
    ? ctas.filter((item) => item.enabled && item.placement === placement)
    : [];

  if (!activeCtas.length) return null;

  const isNav = placement === 'navigation';
  const isHero = placement === 'hero';

  const buttonClass = isNav
    ? 'nav-btn-solid'
    : isHero
    ? 'hero-btn-secondary'
    : 'nav-btn-solid';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
      }}
      data-testid={`site-ctas-${placement}`}
    >
      {activeCtas.map((cta) => (
        <Link
          key={cta.id}
          href={(user && (cta.href === '/login' || cta.href === '/signup')) ? dashboardHref : cta.href}
          onClick={onNavigate}
          className={buttonClass}
        >
          {cta.label}
        </Link>
      ))}
    </div>
  );
}

