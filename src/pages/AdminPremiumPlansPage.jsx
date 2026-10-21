import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Save,
  Clock,
  CreditCard,
  BookOpen,
  Check,
  CheckCircle,
  Search,
  Filter,
  RefreshCw,
  Users,
  AlertCircle,
  FileText,
  Video,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';
import { academicService } from '../lib/academicService';
import { premiumService, DEFAULT_PREMIUM_PLAN } from '../lib/premiumService';

const DURATION_PRESETS = [
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days (1 Month)', days: 30 },
  { label: '60 Days (2 Months)', days: 60 },
  { label: '90 Days (Quarter)', days: 90 },
  { label: '180 Days (Semester)', days: 180 },
  { label: '365 Days (1 Year)', days: 365 },
];

export default function AdminPremiumPlansPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Plan state
  const [planTitle, setPlanTitle] = useState(DEFAULT_PREMIUM_PLAN.title);
  const [planDescription, setPlanDescription] = useState(DEFAULT_PREMIUM_PLAN.description);
  const [priceNgn, setPriceNgn] = useState(DEFAULT_PREMIUM_PLAN.price_ngn);
  const [durationDays, setDurationDays] = useState(DEFAULT_PREMIUM_PLAN.duration_days);
  const [coverAllMaterials, setCoverAllMaterials] = useState(true);
  const [coveredIds, setCoveredIds] = useState(new Set());
  const [isActive, setIsActive] = useState(true);

  // Materials & Subscribers telemetry
  const [materials, setMaterials] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPlan, fetchedMaterials, subscribersRes] = await Promise.all([
        premiumService.getPremiumPlan(),
        academicService.getMaterials(false),
        supabase
          .from('profiles')
          .select('id, full_name, email, role, is_subscribed, subscription_expires_at, created_at')
          .eq('is_subscribed', true)
          .order('subscription_expires_at', { ascending: false }),
      ]);

      if (fetchedPlan) {
        setPlanTitle(fetchedPlan.title || '');
        setPlanDescription(fetchedPlan.description || '');
        setPriceNgn(fetchedPlan.price_ngn || 0);
        setDurationDays(fetchedPlan.duration_days || 0);
        setCoverAllMaterials(Boolean(fetchedPlan.cover_all_materials));
        setCoveredIds(new Set(fetchedPlan.covered_material_ids || []));
        setIsActive(fetchedPlan.is_active ?? true);
      }

      setMaterials(fetchedMaterials || []);
      setSubscribers(subscribersRes.data || []);
    } catch (err) {
      console.warn('Error loading premium plan configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMaterial = (id) => {
    setCoveredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllMaterials = () => {
    setCoveredIds(new Set(materials.map((m) => m.id)));
  };

  const handleDeselectAllMaterials = () => {
    setCoveredIds(new Set());
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const payload = {
        title: planTitle.trim(),
        description: planDescription.trim(),
        price_ngn: Math.max(0, Number(priceNgn || 0)),
        duration_days: Math.max(0, Number(durationDays || 0)),
        covered_material_ids: Array.from(coveredIds),
        cover_all_materials: coverAllMaterials,
        is_active: isActive,
      };

      const res = await premiumService.savePremiumPlan(payload);
      if (!res.success) {
        throw new Error(res.error || 'Failed to save configuration');
      }

      setSaveSuccess('Premium plan configuration saved and synchronized successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving premium plan:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={14} className="text-rose-500" />;
      case 'image':
        return <ImageIcon size={14} className="text-amber-500" />;
      case 'pdf':
      default:
        return <FileText size={14} className="text-[#00873E]" />;
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(materialSearch.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout
      title="Premium Access & Plans"
      subtitle="Configure duration, fees, and material access coverage for student subscribers"
    >
      <div className="max-w-[1400px] space-y-8 pb-12">
        {/* Header Ribbon */}
        <div className="border-b border-gray-100 pb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#00873E] font-mono mb-1 font-semibold">
              <Sparkles size={14} />
              <span>Academy Access Governance</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif tracking-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Premium Plan &amp; Material Coverage
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Define the duration that premium subscriptions last, the subscription fee in NGN, and precisely which learning materials are unlocked upon payment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading || saving}
              className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-[#00873E]' : ''} />
              <span>Refresh Telemetry</span>
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={saving}
              className="px-6 py-2 bg-[#00873E] hover:bg-[#006837] text-white rounded-full text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Saving Changes…' : 'Save Plan Settings'}</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-mono flex items-center gap-2.5 shadow-2xs">
            <CheckCircle size={16} className="text-[#00873E] flex-shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-mono flex items-center gap-2.5 shadow-2xs">
            <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="border border-gray-200/90 bg-white p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Active Premium Fee
            </span>
            <div className="text-2xl font-bold font-mono text-gray-900">
              ₦{Number(priceNgn || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Billed via Paystack Gateway</p>
          </div>

          <div className="border border-gray-200/90 bg-white p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#00873E] font-semibold block mb-1">
              Access Duration
            </span>
            <div className="text-2xl font-bold font-mono text-[#00873E]">
              {durationDays} Days
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">
              ~{Math.round(durationDays / 30)} Month(s) per subscription
            </p>
          </div>

          <div className="border border-gray-200/90 bg-white p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Covered Materials
            </span>
            <div className="text-2xl font-bold font-mono text-gray-900">
              {coverAllMaterials ? materials.length : coveredIds.size} / {materials.length}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">
              {coverAllMaterials ? 'All Materials Covered' : 'Selective Coverage Active'}
            </p>
          </div>

          <div className="border border-gray-200/90 bg-white p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Current Active Subscribers
            </span>
            <div className="text-2xl font-bold font-mono text-gray-900">
              {subscribers.length}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Verified student accounts</p>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Plan Pricing & Duration (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-gray-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
              <h3
                className="text-lg font-bold text-gray-900 font-serif"
                style={{ fontFamily: '"Besley", Georgia, serif' }}
              >
                1. Plan Fee &amp; Details
              </h3>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  Plan Display Title
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="QuickHedge Scholar & Founder Pass"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#00873E]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  Plan Value Proposition Description
                </label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={3}
                  placeholder="Unlocks all learning materials, verified masterclasses, and interactive quizzes."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#00873E] leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  Subscription Price (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-gray-500">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceNgn}
                    onChange={(e) => setPriceNgn(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-[#00873E]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-mono">
                  Charge processed securely through Paystack Inline checkout.
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Duration Duration Presets
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setDurationDays(preset.days)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                        durationDays === preset.days
                          ? 'bg-[#00873E] text-white border-[#00873E]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">Custom Days:</span>
                  <input
                    type="number"
                    min="1"
                    max="1825"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:border-[#00873E]"
                  />
                  <span className="text-xs font-mono text-gray-400">days validity</span>
                </div>
              </div>
            </div>

            {/* Note & Policy Clarification Card */}
            <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-800">
                <Info size={14} />
                <span>Publishing vs Premium Access Coverage</span>
              </div>
              <p>
                <b>Important:</b> Selecting materials here specifies which documents the student unlocks upon purchasing this Premium plan.
              </p>
              <p className="text-[11px] text-amber-800">
                This is independent of the publishing status (draft vs published) and is not a freemium toggle. Non-premium students will see all published material cards in the catalogue, but they will be disabled and locked from opening details or taking quizzes until subscribed.
              </p>
            </div>
          </div>

          {/* Right Column: Material Coverage Selector (7 cols) */}
          <div className="lg:col-span-7">
            <div className="border border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col h-full min-h-[580px]">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3
                    className="text-lg font-bold text-gray-900 font-serif"
                    style={{ fontFamily: '"Besley", Georgia, serif' }}
                  >
                    2. Materials Covered by Premium
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {coverAllMaterials
                      ? `All ${materials.length} published materials are unlocked by this pass`
                      : `${coveredIds.size} of ${materials.length} materials selected for this pass`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCoverAllMaterials((prev) => !prev)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-colors border cursor-pointer ${
                      coverAllMaterials
                        ? 'bg-[#E6F4EA] text-[#006837] border-[#C2E7D0]'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {coverAllMaterials ? '✓ Unlock All Materials' : 'Selective Materials Mode'}
                  </button>
                </div>
              </div>

              {/* Filter bar */}
              <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Search material titles..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#00873E]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="video">Videos</option>
                    <option value="image">Images</option>
                  </select>

                  {!coverAllMaterials && (
                    <>
                      <button
                        type="button"
                        onClick={handleSelectAllMaterials}
                        className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded-lg text-xs font-mono font-semibold cursor-pointer text-gray-700"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllMaterials}
                        className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded-lg text-xs font-mono font-semibold cursor-pointer text-gray-700"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Materials List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[500px]">
                {filteredMaterials.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400 font-mono">
                    No learning materials match the search filter.
                  </div>
                ) : (
                  filteredMaterials.map((mat) => {
                    const isChecked = coverAllMaterials || coveredIds.has(mat.id);

                    return (
                      <div
                        key={mat.id}
                        onClick={() => {
                          if (!coverAllMaterials) {
                            handleToggleMaterial(mat.id);
                          }
                        }}
                        className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                          coverAllMaterials
                            ? 'bg-white opacity-90'
                            : isChecked
                            ? 'bg-[#E6F4EA]/30 hover:bg-[#E6F4EA]/50 cursor-pointer'
                            : 'hover:bg-gray-50/70 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            type="button"
                            disabled={coverAllMaterials}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!coverAllMaterials) handleToggleMaterial(mat.id);
                            }}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                              isChecked
                                ? 'bg-[#00873E] text-white border-[#00873E]'
                                : 'bg-white border-gray-300 text-transparent'
                            }`}
                          >
                            <Check size={13} strokeWidth={3} />
                          </button>

                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-gray-900 truncate font-serif">
                              {mat.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                              <span className="flex items-center gap-1">
                                {getTypeIcon(mat.type)}
                                <span className="capitalize">{mat.type}</span>
                              </span>
                              <span>•</span>
                              <span>
                                {mat.created_at
                                  ? new Date(mat.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : 'Curriculum Document'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isChecked ? (
                            <span className="px-2.5 py-0.5 bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0] rounded-full text-[10px] font-mono font-semibold">
                              Covered
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-mono">
                              Excluded
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Save Prompt */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">
                  {coverAllMaterials
                    ? `Universal Coverage: All ${materials.length} materials will be unlocked`
                    : `Selected: ${coveredIds.size} of ${materials.length} materials`}
                </span>
                <button
                  type="button"
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="px-5 py-1.5 bg-[#00873E] hover:bg-[#006837] text-white rounded-full text-xs font-mono uppercase tracking-wider font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Subscribed Students Live Telemetry */}
        <div className="border border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3
                className="text-lg font-bold text-gray-900 font-serif"
                style={{ fontFamily: '"Besley", Georgia, serif' }}
              >
                Active Subscribers Telemetry
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Students currently carrying active subscription validity and remaining days
              </p>
            </div>
            <span className="px-3 py-1 bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0] rounded-full text-xs font-mono font-bold">
              {subscribers.length} Active Students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-mono text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Expiration Date</th>
                  <th className="px-6 py-3.5">Remaining Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-mono">
                      No active paying student subscribers recorded yet.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => {
                    const expiresAt = sub.subscription_expires_at ? new Date(sub.subscription_expires_at) : null;
                    const isExpired = expiresAt && expiresAt.getTime() < Date.now();
                    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 'Lifetime';

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{sub.full_name || 'Student Member'}</p>
                          <p className="text-[11px] font-mono text-gray-400">{sub.email || sub.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                              isExpired
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-[#00873E]'}`} />
                            <span>{isExpired ? 'Expired' : 'Active Premium'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600">
                          {expiresAt ? expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Indefinite / Uncapped'}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          {isExpired ? (
                            <span className="text-rose-600">0 Days (Renew required)</span>
                          ) : typeof daysRemaining === 'number' ? (
                            <span className="text-[#00873E]">{daysRemaining} Days Remaining</span>
                          ) : (
                            <span className="text-gray-600">Lifetime Pass</span>
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
    </AdminLayout>
  );
}
