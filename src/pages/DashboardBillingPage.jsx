import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  Loader2,
  ExternalLink,
  FileText,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { premiumService } from '../lib/premiumService';

export default function DashboardBillingPage() {
  const { user, isSubscribed, profile } = useAuth();
  const userIsPremium = Boolean(isSubscribed || profile?.is_subscribed);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    premiumService.getPremiumPlan().then(setActivePlan).catch(() => {});
  }, []);

  const fetchPayments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.warn('Error fetching payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    if (!user) return;

    // Realtime subscription for student transactions
    const channel = supabase
      .channel(`public:payments:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <DashboardLayout title="Billing & Subscriptions" showToolbar={false} showSearch={false}>
      <div
        className="max-w-[1400px] h-full flex flex-col flex-1"
        style={{ minHeight: 'calc(100vh - 160px)' }}
      >
        {/* Section Header */}
        <div className="border-b border-gray-100 pb-5 mb-5 flex-shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#00873E] font-mono mb-1 font-semibold">
              <span>Account &amp; Billing</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif tracking-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Billing &amp; Subscriptions
            </h1>
          </div>

          {!userIsPremium && (
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 18px',
                height: '34px',
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
          )}
        </div>

        {paymentSuccessMsg && (
          <div className="mb-5 p-4 bg-[#E6F4EA] border border-[#C2E7D0] rounded-2xl text-[#006837] text-xs font-mono flex items-center gap-2.5 shadow-xs flex-shrink-0">
            <CheckCircle size={16} />
            <span>{paymentSuccessMsg}</span>
          </div>
        )}

        {/* Historical Transactions Table (Full Height) */}
        <div className="flex-1 flex flex-col min-h-0 pb-2">
          <div className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col">
            <div className="overflow-x-auto w-full flex-1 flex flex-col">
              <table className="w-full text-left text-xs sm:text-sm flex-1 flex flex-col h-full min-w-[580px]">
                <thead className="flex-shrink-0">
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase font-mono tracking-wider text-[11px] sm:text-xs flex w-full">
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[140px] border-r border-gray-200">Reference ID</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[120px] border-r border-gray-200">Amount (NGN)</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[140px] border-r border-gray-200">Timestamp</th>
                    <th className="py-4 px-6 font-semibold flex-1 min-w-[170px] text-right">Status &amp; Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 flex-1 flex flex-col relative">
                  {loading ? (
                    <tr className="flex-1 flex items-center justify-center w-full relative">
                      {/* Background Column Guide Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        <div className="flex-1 min-w-[140px] border-r border-gray-200" />
                        <div className="flex-1 min-w-[120px] border-r border-gray-200" />
                        <div className="flex-1 min-w-[140px] border-r border-gray-200" />
                        <div className="flex-1 min-w-[170px]" />
                      </div>
                      <td colSpan={4} className="w-full py-12 text-center flex flex-col items-center justify-center relative z-10">
                        <div className="bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center">
                          <Loader2 size={36} className="animate-spin text-[#00873E] mb-3" />
                          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
                            Retrieving Transactions…
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr className="flex-1 flex items-center justify-center w-full relative">
                      {/* Background Column Guide Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        <div className="flex-1 min-w-[140px] border-r border-gray-200" />
                        <div className="flex-1 min-w-[120px] border-r border-gray-200" />
                        <div className="flex-1 min-w-[140px] border-r border-gray-200" />
                        <div className="flex-1 min-w-[170px]" />
                      </div>
                      <td colSpan={4} className="w-full py-12 text-center flex flex-col items-center justify-center px-4 relative z-10">
                        <div className="bg-white/95 backdrop-blur-xs p-8 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center max-w-md mx-auto">
                          <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200/90 flex items-center justify-center mb-5 text-gray-400 shadow-2xs">
                            <CreditCard size={38} className="text-gray-400" />
                          </div>
                          <h3
                            className="text-xl sm:text-2xl font-bold text-gray-900 font-serif mb-2"
                            style={{ fontFamily: '"Besley", Georgia, serif' }}
                          >
                            No Transactions Found
                          </h3>
                          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed mb-4">
                            Your billing history, subscription settlements, and invoices will be recorded here.
                          </p>
                          {!userIsPremium ? (
                            <button
                              type="button"
                              onClick={() => setUpgradeModalOpen(true)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '10px 22px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#1F1F1F',
                                backgroundColor: '#F0F4F9',
                                border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              className="hover:bg-gray-200"
                            >
                              <span>Manage plan</span>
                              <ExternalLink size={13} />
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E6F4EA] border border-[#C2E7D0] rounded-full text-[#006837] text-xs font-semibold">
                              <CheckCircle size={14} />
                              <span>Premium Subscription Active</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors flex w-full items-center">
                        <td className="py-4.5 px-6 font-mono text-[#00873E] font-semibold flex-1 min-w-[140px] border-r border-gray-200">
                          {p.reference}
                        </td>
                        <td className="py-4.5 px-6 font-mono text-gray-900 font-bold flex-1 min-w-[120px] border-r border-gray-200">
                          ₦{Number(p.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-4.5 px-6 font-mono text-gray-400 flex-1 min-w-[140px] border-r border-gray-200">
                          {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-4.5 px-6 text-right flex-1 min-w-[170px] flex items-center justify-end gap-3">
                          <span
                            className={`text-xs font-mono font-bold uppercase tracking-wider ${
                              p.status === 'success'
                                ? 'text-emerald-600'
                                : p.status === 'pending'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {p.status || 'success'}
                          </span>

                          {p.status === 'success' && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptPayment(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer shadow-2xs"
                              title="View official payment receipt"
                            >
                              <FileText size={12} className="text-[#00873E]" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          onSuccess={() => {
            fetchPayments();
          }}
        />

        {/* Payment Receipt Modal */}
        <PaymentReceiptModal
          isOpen={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          plan={activePlan}
          user={user}
          profile={profile}
        />
      </div>
    </DashboardLayout>
  );
}
