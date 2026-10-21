import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import QuickHedgeLogo from './QuickHedgeLogo';

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  payment = null,
  plan = null,
  user = null,
  profile = null,
  onContinue,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Derive transaction details
  const reference = payment?.reference || payment?.id || 'QH-REC-PENDING';
  const amount = Number(payment?.amount || 0);
  const channel = payment?.channel || 'Paystack';
  const dateObj = payment?.created_at ? new Date(payment.created_at) : new Date();
  
  // Derive exact duration in days
  const durationDays =
    Number(
      payment?.duration_days ||
      payment?.metadata?.duration_days ||
      payment?.metadata?.custom_fields?.find?.((f) => f.variable_name === 'duration_days')?.value ||
      plan?.duration_days
    ) ||
    (profile?.subscription_expires_at && payment?.created_at
      ? Math.max(
          1,
          Math.round(
            (new Date(profile.subscription_expires_at).getTime() - new Date(payment.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : Number(plan?.duration_days || 0));

  const planTitle = payment?.plan_title || plan?.title || '';

  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const customerName =
    profile?.full_name ||
    (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '') ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'QuickHedge Member';

  const customerEmail = user?.email || profile?.email;

  const handleCopyRef = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      {/* Print-specific style block */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #quickhedge-printable-receipt,
          #quickhedge-printable-receipt * {
            visibility: visible !important;
          }
          #quickhedge-printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 32px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          .receipt-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '92vh',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Modal Top Control Bar (Non-printed) */}
        <div className="receipt-no-print flex items-center justify-between px-6 py-3.5 bg-gray-50/80 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00873E]" />
            <span className="text-xs font-mono font-semibold text-gray-700 uppercase tracking-wider">
              Payment Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
              title="Print or Save PDF"
            >
              <Printer size={13} className="text-gray-600" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8" id="quickhedge-printable-receipt">
          {/* Header: Logo & Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <QuickHedgeLogo height={28} color="#111827" accentColor="#00873E" withAccent={true} />
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-mono text-gray-400">
                {formattedDate} • {formattedTime}
              </div>
            </div>
          </div>

          {/* Customer & Transaction Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-gray-100 text-xs">
            {/* Left: Customer Info */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 block">
                Billed To
              </span>
              <p className="font-bold text-gray-900 text-sm">{customerName}</p>
              <p className="text-gray-500 font-mono text-xs">{customerEmail}</p>
            </div>

            {/* Right: Payment Reference */}
            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 block">
                Transaction Reference
              </span>
              <div className="flex items-center sm:justify-end gap-1.5">
                <span className="font-mono text-xs text-[#00873E] font-semibold truncate max-w-[200px]">
                  {reference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="receipt-no-print text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                  title="Copy reference"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-5 border-b border-gray-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-gray-100 pb-2">
                  <th className="pb-2 font-semibold">Description</th>
                  <th className="pb-2 font-semibold text-center w-12">Qty</th>
                  <th className="pb-2 font-semibold text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="py-3 pr-2">
                    <p className="font-bold text-gray-900 font-serif text-sm" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                      {planTitle}
                    </p>
                    <p className="text-[11px] text-gray-500 font-sans mt-0.5 leading-relaxed">
                      {durationDays}-Day unlimited access to physical education &amp; sports science study materials, interactive question banks, live simulations &amp; performance tracking.
                    </p>
                  </td>
                  <td className="py-3 text-center font-mono text-gray-600">1</td>
                  <td className="py-3 text-right font-mono font-bold text-gray-900 text-sm">
                    ₦{amount.toLocaleString()}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Breakdown Summary */}
          <div className="py-4 space-y-2 border-b border-gray-100 text-xs">
            <div className="flex justify-between items-center text-gray-500 font-mono">
              <span>Subtotal</span>
              <span>₦{amount.toLocaleString()}.00</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-gray-900">
                Total Paid
              </span>
              <span
                className="text-2xl font-extrabold text-[#00873E] font-mono tracking-tight"
              >
                ₦{amount.toLocaleString()}.00
              </span>
            </div>
          </div>

          {/* Simple Clean Footer */}
          <div className="pt-5 text-center">
            <p className="text-xs text-gray-500 font-sans">
              Thank you for your payment to <strong className="text-gray-800">QuickHedge Inc.</strong>
            </p>
            <p className="text-[11px] text-gray-400 font-mono mt-1">
              For support or inquiries, please contact{' '}
              <a href="mailto:billing@quick-hedgeconsulting.com" className="text-[#00873E] underline">
                billing@quick-hedgeconsulting.com
              </a>
            </p>
          </div>
        </div>

        {/* Modal Bottom CTA Bar (Non-printed) */}
        <div className="receipt-no-print p-4 sm:p-5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-end flex-shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1F1F1F',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '9999px',
                cursor: 'pointer',
              }}
              className="hover:bg-gray-100 flex-1 sm:flex-initial"
            >
              <Download size={13} />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onContinue) onContinue();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 22px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#00873E',
                border: '1px solid #00873E',
                borderRadius: '9999px',
                cursor: 'pointer',
              }}
              className="hover:bg-[#006837] shadow-sm flex-1 sm:flex-initial"
            >
              <span>Continue</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
