import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        setError(resetError.message || 'Unable to process recovery request. Please try again.');
      } else {
        // Direct flow to OTP verification for recovery
        setLocation(`/verify-otp?email=${encodeURIComponent(email.trim())}&type=recovery`);
      }
    } catch (err) {
      setError(err?.message || 'An unexpected recovery error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qh-auth-page">
      {/* ======================================================== */}
      {/* LEFT SECTION: Clean, Crisp Recovery Form (White)         */}
      {/* ======================================================== */}
      <div className="qh-auth-form-side">
        <div className="qh-auth-form-inner max-w-[420px]">
          {/* Mobile-only Brand Logo */}
          <div className="lg:hidden mb-6">
            <Link
              href="/"
              className="inline-block hover:opacity-85 transition-opacity"
              aria-label="QuickHedge Home"
            >
              <QuickHedgeLogo
                height={28}
                color="#001e2b"
                accentColor="#00873E"
                withAccent={true}
              />
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1
              className="text-3xl sm:text-[34px] font-normal tracking-tight leading-tight qh-font-serif"
              style={{ color: '#001e2b' }}
            >
              Reset your password
            </h1>

            <p className="text-sm mt-2 font-medium" style={{ color: '#475569' }}>
              Remember your credentials?{' '}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: '#00873E' }}
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mt-6 p-3.5 rounded-md bg-red-50 border border-red-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span style={{ color: '#b91c1c' }}>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mt-8 p-6 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4" style={{ color: '#00873E' }}>
                <Mail size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#001e2b' }}>Check your inbox</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#334155' }}>
                We've dispatched an encrypted passphrase recovery link to{' '}
                <strong className="font-mono" style={{ color: '#001e2b' }}>{email}</strong>. Please follow the instructions to renew your access credentials.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="qh-auth-social-btn"
                >
                  Resend recovery email
                </button>
                <Link
                  href="/login"
                  className="qh-auth-primary-btn text-center block"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                Enter the email address tied to your QuickHedge account, and we'll send you an encrypted recovery link valid for 60 minutes.
              </p>

              <div>
                <label
                  htmlFor="reset-email"
                  className="qh-auth-label"
                >
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="qh-auth-input"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="qh-auth-primary-btn mt-2"
              >
                {loading ? (
                  <span>Sending Link…</span>
                ) : (
                  <>
                    <span>Send Recovery Link</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline transition-colors"
                  style={{ color: '#00873E' }}
                >
                  <ArrowLeft size={13} />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Copyright */}
        <div className="qh-auth-copyright">
          <span>&copy; 2026 QuickHedge Inc.</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SECTION: Rich Emerald Showcase Poster with Logo    */}
      {/* ======================================================== */}
      <div className="qh-auth-showcase-side">
        {/* Organic Flowing Curves & Ambient Motif */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 80% 25%, rgba(0, 135, 62, 0.48) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(0, 104, 55, 0.58) 0%, transparent 60%), #001e2b',
          }}
        />

        {/* Stylized Curved Vector Shapes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 800 800"
        >
          <path
            d="M 220,0 C 380,180 460,120 520,380 C 580,620 720,680 800,800 L 800,0 Z"
            fill="rgba(0, 135, 62, 0.38)"
          />
          <path
            d="M 0,380 C 160,440 280,320 420,580 C 520,780 680,720 800,800 L 0,800 Z"
            fill="rgba(0, 77, 44, 0.45)"
          />
        </svg>

        {/* Top Header: Brand Logo Prominently Positioned on Right Side */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-block hover:opacity-90 transition-opacity"
            aria-label="QuickHedge Home"
          >
            <QuickHedgeLogo
              height={34}
              color="#ffffff"
              accentColor="#00873E"
              withAccent={true}
            />
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/40 font-semibold">
            Institutional Platform
          </span>
        </div>

        {/* Center: Refined Brand Emblem & Motto */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 shadow-2xl backdrop-blur-sm">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <path d="M 32 6 L 56 30 L 46 40 L 32 26 L 18 40 L 8 30 Z" fill="#00873E" />
              <path d="M 32 26 L 56 50 L 46 60 L 32 46 L 18 60 L 8 50 Z" fill="#ffffff" />
            </svg>
          </div>
          <h2
            className="font-serif text-2xl xl:text-3xl text-white font-normal tracking-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            QuickHedge
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-[#00873E] font-semibold mt-2 font-sans">
            Advancing Physical Education &amp; Sports Science
          </p>
        </div>

      </div>
    </div>
  );
}
