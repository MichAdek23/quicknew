import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Check, Save, RefreshCw, Loader2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { initialSettings, initialSiteCtas } from '../data/initialData';
import { supabase } from '../lib/supabase';
import { dataService } from '../lib/dataService';

export default function AdminWebsiteSettingsPage() {
  const [fundingOpen, setFundingOpen] = useState(initialSettings.fundingOpen);
  const [ctasEnabled, setCtasEnabled] = useState(initialSiteCtas.enabled);
  const [ctas, setCtas] = useState(initialSiteCtas.items);
  const [ticketPriceNgn, setTicketPriceNgn] = useState(initialSettings.ticketPriceNgn);
  const [eventDate, setEventDate] = useState(initialSettings.eventDate);
  const [contactPhone, setContactPhone] = useState(initialSettings.contact.phone);
  const [contactEmail, setContactEmail] = useState(initialSettings.contact.email);
  const [contactAddress, setContactAddress] = useState(initialSettings.contact.addressLines.join('\n'));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchLiveSettings = async () => {
      try {
        const [settingsMap, liveCtas] = await Promise.all([
          dataService.getAppSettings(),
          dataService.getSiteCtas(),
        ]);

        if (settingsMap && Object.keys(settingsMap).length > 0) {
          if (settingsMap.funding_open !== undefined) setFundingOpen(settingsMap.funding_open === 'true');
          if (settingsMap.ctas_enabled !== undefined) setCtasEnabled(settingsMap.ctas_enabled === 'true');
          if (settingsMap.ticket_price_ngn !== undefined) setTicketPriceNgn(Number(settingsMap.ticket_price_ngn));
          if (settingsMap.event_date !== undefined) setEventDate(settingsMap.event_date);
          if (settingsMap.contact_phone !== undefined) setContactPhone(settingsMap.contact_phone);
          if (settingsMap.contact_email !== undefined) setContactEmail(settingsMap.contact_email);
          if (settingsMap.contact_address !== undefined) setContactAddress(settingsMap.contact_address);
        }

        if (liveCtas && liveCtas.length > 0) {
          setCtas(liveCtas);
        }
      } catch (err) {
        console.warn('Could not load live settings from Supabase:', err);
      }
    };

    fetchLiveSettings();
  }, []);

  const toggleCta = async (id) => {
    setCtas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      // Upsert settings into app_settings
      const settingsEntries = [
        { key: 'funding_open', value: String(fundingOpen), updated_at: new Date().toISOString() },
        { key: 'ctas_enabled', value: String(ctasEnabled), updated_at: new Date().toISOString() },
        { key: 'ticket_price_ngn', value: String(ticketPriceNgn), updated_at: new Date().toISOString() },
        { key: 'event_date', value: String(eventDate), updated_at: new Date().toISOString() },
        { key: 'contact_phone', value: String(contactPhone), updated_at: new Date().toISOString() },
        { key: 'contact_email', value: String(contactEmail), updated_at: new Date().toISOString() },
        { key: 'contact_address', value: String(contactAddress), updated_at: new Date().toISOString() },
      ];

      await Promise.all([
        supabase.from('app_settings').upsert(settingsEntries),
        ...ctas.map((cta) =>
          supabase.from('site_ctas').upsert({
            id: cta.id,
            label: cta.label,
            href: cta.href,
            placement: cta.placement,
            variant: cta.variant || 'primary',
            enabled: cta.enabled,
            sort_order: cta.sort_order ?? 0,
            updated_at: new Date().toISOString(),
          })
        ),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving settings to Supabase:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Website Settings">
      <div className="max-w-[1280px]">
        {/* Header */}
        <header className="mb-8 border-b border-gray-100 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Settings</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Website Settings
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Live operational controls connected to Supabase PostgreSQL app_settings table.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#00873E] text-white font-semibold text-xs uppercase tracking-widest hover:bg-[#006837] transition-colors rounded-full shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            <span>{saving ? 'Syncing to DB…' : saved ? 'Saved Live' : 'Save Live Settings'}</span>
          </button>
        </header>

        {/* Section 1: Academic Research & Fellowship Grants Availability */}
        <section className="mb-8 border border-gray-200/90 bg-white p-6 sm:p-7 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Academic Research &amp; Fellowship Grants Availability</h2>
            <p className="mt-1 text-xs text-gray-500">
              {fundingOpen
                ? 'Open — Scholars and athletic educators can view and submit academic grant applications.'
                : 'Closed — Application intake is paused; visitors view closed status.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFundingOpen(!fundingOpen)}
            className={`px-5 py-2.5 text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors cursor-pointer rounded-full ${
              fundingOpen
                ? 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0] hover:bg-[#D8EEDF]'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900'
            }`}
          >
            {fundingOpen ? <ToggleRight size={18} className="text-[#00873E]" /> : <ToggleLeft size={18} className="text-gray-400" />}
            <span>{fundingOpen ? 'Status: OPEN' : 'Status: CLOSED'}</span>
          </button>
        </section>

        {/* Section 2: Call to Action Visibility */}
        <section className="mb-8 border border-gray-200/90 bg-white p-6 sm:p-7 rounded-2xl shadow-xs">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-base font-semibold text-gray-900">Call-to-Action Visibility</h2>
            <p className="text-xs text-gray-500 mt-1">
              Toggle primary interactive actions across Navigation, Hero, and Footer sections.
            </p>
          </div>

          <div className="space-y-3.5">
            {ctas.map((cta) => (
              <div
                key={cta.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-200/80 bg-gray-50/50 rounded-xl"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-semibold text-xs">{cta.label}</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full font-medium">
                      Placement: {cta.placement}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{cta.href}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCta(cta.id)}
                  className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold border transition-colors cursor-pointer rounded-full ${
                    cta.enabled
                      ? 'border-[#C2E7D0] text-[#006837] bg-[#E6F4EA]'
                      : 'border-gray-200 text-gray-500 hover:text-gray-800 bg-white'
                  }`}
                >
                  {cta.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Event & Pricing Controls */}
        <section className="border border-gray-200/90 bg-white p-6 sm:p-7 rounded-2xl shadow-xs mb-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-base font-semibold text-gray-900">Intelligence Summit &amp; Allocations</h2>
            <p className="text-xs text-gray-500 mt-1">
              Configured parameters for event admissions and partner registration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2 font-mono font-bold">
                Ticket Price (NGN)
              </label>
              <input
                type="number"
                value={ticketPriceNgn}
                onChange={(e) => setTicketPriceNgn(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] transition-colors rounded-xl font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2 font-mono font-bold">
                Summit Date
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="24 October 2026"
                className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] transition-colors rounded-xl shadow-2xs"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Live Contact & Headquarters Details */}
        <section className="border border-gray-200/90 bg-white p-6 sm:p-7 rounded-2xl shadow-xs">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-base font-semibold text-gray-900">Live Institutional Contact &amp; Headquarters</h2>
            <p className="text-xs text-gray-500 mt-1">
              Contact coordinates reflected dynamically across the footer, outreach links, and partner inquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2 font-mono font-bold">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+234 803 893 3808"
                className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] transition-colors rounded-xl shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2 font-mono font-bold">
                Official Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@quick-hedgeconsulting.com"
                className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] transition-colors rounded-xl shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2 font-mono font-bold">
              Headquarters Physical Address (one line per entry)
            </label>
            <textarea
              rows={4}
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="4th floor, Churchgate Tower,&#10;Plot 473 Constitution Avenue,&#10;Central Business District,&#10;Abuja, FCT."
              className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] transition-colors rounded-xl font-mono shadow-2xs"
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
