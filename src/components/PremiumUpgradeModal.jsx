import React, { useState } from 'react';
import { X, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { premiumService, DEFAULT_PREMIUM_PLAN } from '../lib/premiumService';
import PaymentReceiptModal from './PaymentReceiptModal';

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  plan = DEFAULT_PREMIUM_PLAN,
  materialTitle = '',
  onSuccess,
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // If receipt is active, show the receipt modal directly
  if (receiptData) {
    return (
      <PaymentReceiptModal
        isOpen={true}
        onClose={() => {
          setReceiptData(null);
          onClose();
        }}
        payment={receiptData}
        plan={currentPlan}
        user={user}
        profile={profile}
        onContinue={() => {
          setReceiptData(null);
          onClose();
        }}
      />
    );
  }

  const [livePlan, setLivePlan] = useState(plan);

  React.useEffect(() => {
    if (!plan || !plan.price_ngn) {
      premiumService.getPremiumPlan().then((p) => {
        if (p && p.price_ngn) setLivePlan(p);
      });
    } else {
      setLivePlan(plan);
    }
  }, [plan]);

  const currentPlan = livePlan || plan || DEFAULT_PREMIUM_PLAN;
  const priceNgn = Number(currentPlan?.price_ngn || 0);
  const durationDays = Number(currentPlan?.duration_days || 0);

  const handlePay = async () => {
    setErrorMsg('');
    setProcessing(true);
    try {
      await premiumService.processPaystackSubscription({
        user,
        plan: currentPlan,
        onSuccess: (ref) => {
          refreshProfile();
          setProcessing(false);
          try {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          setReceiptData({
            reference: ref,
            amount: priceNgn,
            created_at: new Date().toISOString(),
            channel: 'Paystack Card / Transfer',
            status: 'success',
            duration_days: durationDays,
            plan_title: currentPlan.title,
          });
          if (onSuccess) onSuccess(ref);
        },
        onClose: () => {
          setProcessing(false);
        },
      });
    } catch (err) {
      console.error('Payment launch error:', err);
      setErrorMsg(err.message || 'Could not initiate payment gateway.');
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-black/5 flex flex-col items-center text-center relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={15} />
        </button>

        {/* Clean Simple Message */}
        <h3
          className="text-lg sm:text-xl font-bold text-gray-900 font-serif mt-1 leading-snug px-3"
          style={{ fontFamily: '"Besley", Georgia, serif' }}
        >
          To use the application, subscribe to premium
        </h3>

        {/* The Amount */}
        <div className="my-6">
          <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-mono tracking-tight">
            ₦{priceNgn.toLocaleString()}
          </div>
          {durationDays && (
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1 block">
              {durationDays} Days Access
            </span>
          )}
        </div>

        {/* The Pay Button styled like the screenshot */}
        <button
          type="button"
          onClick={handlePay}
          disabled={processing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 26px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#1F1F1F',
            backgroundColor: '#F0F4F9',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '9999px',
            cursor: processing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="hover:bg-[#E4E9F0] active:scale-[0.98] shadow-2xs disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 size={14} className="animate-spin text-gray-700" />
              <span>Connecting…</span>
            </>
          ) : (
            <>
              <span>Pay ₦{priceNgn.toLocaleString()}</span>
              <ExternalLink size={13} className="text-[#1F1F1F] stroke-[2.4]" />
            </>
          )}
        </button>

        {/* Error / Success feedback */}
        {errorMsg && (
          <p className="mt-3 text-xs text-rose-600 font-mono">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="mt-3 text-xs text-emerald-600 font-mono font-semibold flex items-center justify-center gap-1">
            <CheckCircle2 size={13} />
            <span>{successMsg}</span>
          </p>
        )}
      </div>
    </div>
  );
}
