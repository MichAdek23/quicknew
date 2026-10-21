import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FolderOpen,
  Filter,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPaymentsData = async () => {
    setRefreshing(true);
    try {
      const [paymentsRes, profilesRes] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email, is_subscribed'),
      ]);

      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    } catch (err) {
      console.warn('Error fetching payments telemetry:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const filteredPayments = payments.filter((pay) => {
    const user = profileMap.get(pay.user_id);
    const term = search.toLowerCase();
    const matchesSearch =
      (pay.reference || '').toLowerCase().includes(term) ||
      (user?.email || '').toLowerCase().includes(term) ||
      (user?.full_name || '').toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' || (pay.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalVolume = payments
    .filter((p) => (p.status || '').toLowerCase() === 'success')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const subscribedUsersCount = profiles.filter((p) => p.is_subscribed).length;

  return (
    <AdminLayout title="Financials & Payments">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 font-serif tracking-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Financials &amp; Paystack Transactions
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Live settlement telemetry, ticket payments, and cohort subscriptions from Supabase.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/premium-plans"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer rounded-full shadow-2xs font-mono"
            >
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Premium Plan Config</span>
            </Link>

            <button
              type="button"
              onClick={fetchPaymentsData}
              disabled={refreshing}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer rounded-full shadow-2xs"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'} />
              <span>{refreshing ? 'Syncing…' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-gray-200/90 bg-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Settled Volume (NGN)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#00873E]">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight font-mono mb-1">
              ₦{totalVolume.toLocaleString('en-NG')}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              From {payments.filter((p) => p.status === 'success').length} verified transactions
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00873E]" />
          </div>

          <div className="border border-gray-200/90 bg-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Active Subscriptions
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight font-serif mb-1" style={{ fontFamily: '"Besley", Georgia, serif' }}>
              {subscribedUsersCount}
            </div>
            <p className="text-xs text-gray-400">Founders with unlocked cohort access</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          <div className="border border-gray-200/90 bg-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold font-mono">
                Gateway Provider
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight font-serif mb-1" style={{ fontFamily: '"Besley", Georgia, serif' }}>
              Paystack
            </div>
            <p className="text-xs text-gray-400 font-mono">Live webhooks &amp; card processing</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Paystack reference or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#00873E] transition-colors rounded-full font-mono"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-4 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#00873E] rounded-full cursor-pointer"
            >
              <option value="all">All Statuses ({payments.length})</option>
              <option value="success">Successful Only</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="border border-gray-200 bg-white shadow-xs rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs font-semibold text-gray-600 uppercase font-mono">
            <span>Transaction Ledger ({filteredPayments.length})</span>
            <span>Settlement Telemetry</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-gray-400 font-mono">
              Querying database payments records…
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-20 text-center p-8">
              <FolderOpen size={30} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-1">No Transactions Found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Completed founder registration ticket payments and Paystack charges will be recorded here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 uppercase font-mono text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Reference</th>
                    <th className="px-6 py-3.5 font-semibold">User / Member</th>
                    <th className="px-6 py-3.5 font-semibold">Amount</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Settled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((pay) => {
                    const linkedUser = profileMap.get(pay.user_id);
                    const isSuccess = (pay.status || '').toLowerCase() === 'success';
                    return (
                      <tr key={pay.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-800 select-all font-semibold">
                          {pay.reference}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900 font-medium">
                            {linkedUser?.full_name || 'QuickHedge Member'}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {linkedUser?.email || pay.user_id?.slice(0, 12)}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          ₦{Number(pay.amount || 0).toLocaleString('en-NG')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSuccess ? 'bg-[#00873E]' : 'bg-amber-500'
                              }`}
                            />
                            {pay.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400 font-mono">
                          {pay.created_at ? new Date(pay.created_at).toLocaleString() : 'Recent'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
