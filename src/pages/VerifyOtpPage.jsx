import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Mail } from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtpPage() {
  const [, setLocation] = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  // Read email and type from URL parameters
  const [email, setEmail] = useState('');
  const [otpType, setOtpType] = useState('signup');

  // 6 discrete OTP boxes
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Extract query params on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const typeParam = params.get('type');
      const reasonParam = params.get('reason');
      if (emailParam) {
        setEmail(emailParam);
      }
      if (typeParam) {
        setOtpType(typeParam);
      }
      if (reasonParam === 'unverified') {
        setError('Please verify your email address to continue. A 6-digit confirmation code was sent from admin@quick-hedgeconsulting.com.');
      }
    } catch {
      // ignore
    }

    // Auto-focus first input box
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 60-second countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle single character input or direct paste into a box
  const handleDigitChange = (index, e) => {
    const val = e.target.value;

    // In case user typed or pasted multiple numbers
    const cleanNumbers = val.replace(/\D/g, '');

    if (cleanNumbers.length > 1) {
      handleFillDigits(cleanNumbers, index);
      return;
    }

    const char = cleanNumbers.slice(-1) || '';
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setError('');

    // If character was entered, advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Helper to fill digits from a sequence (e.g. pasted or multi-char)
  const handleFillDigits = (digitsStr, startIndex = 0) => {
    const cleanDigits = digitsStr.replace(/\D/g, '').split('');
    const newOtp = [...otp];

    let currentIndex = startIndex;
    for (let i = 0; i < cleanDigits.length && currentIndex < 6; i++) {
      newOtp[currentIndex] = cleanDigits[i];
      currentIndex++;
    }

    setOtp(newOtp);
    setError('');

    // Focus the box after the last filled digit (or the 6th box if all 6 filled)
    const focusTarget = Math.min(currentIndex, 5);
    inputRefs.current[focusTarget]?.focus();
  };

  // Keyboard navigation: Backspace and Arrow keys
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Global paste handler on the container or any input box
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    handleFillDigits(pastedText, 0);
  };

  // Form submission: live Supabase verifyOtp
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      setError('Missing registered email address. Please sign up or log in again.');
      return;
    }

    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter all 6 digits of your confirmation code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: verifyError } = await verifyOtp(email.trim(), token, otpType);

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired confirmation code. Please check your email or click "Resend Code".');
        // Unlock Resend button immediately so user isn't stuck waiting
        setCountdown(0);
      } else {
        if (otpType === 'recovery') {
          sessionStorage.setItem(`qh_recovery_token_${email.trim().toLowerCase()}`, token);
          setSuccess('Identity verified! Redirecting to set your new password…');
          setTimeout(() => {
            setLocation(`/reset-password?email=${encodeURIComponent(email.trim())}&token=${encodeURIComponent(token)}&verified=true`);
          }, 1000);
        } else {
          setSuccess('Credentials verified successfully! Redirecting to sign in…');
          setTimeout(() => {
            setLocation('/login?verified=true');
          }, 1000);
        }
      }
    } catch (err) {
      setError(err?.message || 'An unexpected verification error occurred.');
      setCountdown(0);
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resending) return;
    if (!email.trim()) {
      setError('Missing registered email address. Please sign up or log in again.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const { error: resendError } = await resendOtp(email.trim(), otpType);

      if (resendError) {
        setError(resendError.message || 'Unable to resend code. Please wait a moment and try again.');
      } else {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        setSuccess(`A new 6-digit ${otpType === 'recovery' ? 'password reset' : 'confirmation'} code has been dispatched to your email from admin@quick-hedgeconsulting.com.`);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
        setTimeout(() => setSuccess(''), 8000);
      }
    } catch (err) {
      setError(err?.message || 'Failed to dispatch new confirmation code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="qh-auth-page">
      {/* ======================================================== */}
      {/* LEFT SECTION: Institutional OTP Verification Form        */}
      {/* ======================================================== */}
      <div className="qh-auth-form-side">
        <div className="qh-auth-form-inner max-w-[440px]">
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
              className="text-2xl sm:text-[30px] font-normal tracking-tight leading-tight qh-font-serif"
              style={{ color: '#001e2b' }}
            >
              {otpType === 'recovery' ? 'Verify your identity' : 'Confirm your account'}
            </h1>

            <p className="text-xs sm:text-sm mt-2 font-medium" style={{ color: '#475569' }}>
              {otpType === 'recovery'
                ? 'We sent a 6-digit password recovery code from '
                : 'We sent a 6-digit confirmation code from '}
              <span className="font-semibold text-slate-800">admin@quick-hedgeconsulting.com</span> to
            </p>

            {/* Read-Only Registered Email Display */}
            <div className="mt-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="font-semibold truncate max-w-[320px]">
                  {email || 'your registered email'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <span style={{ color: '#b91c1c' }}>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2 leading-relaxed">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span style={{ color: '#047857' }}>{success}</span>
            </div>
          )}

          {/* 6-Digit OTP Form */}
          <form onSubmit={handleSubmit}>
            <label className="qh-auth-label text-center block !mb-2">
              Enter 6-Digit Security Code
            </label>

            {/* 6 Discrete OTP Input Boxes */}
            <div className="qh-otp-container" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleDigitChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`qh-otp-box ${digit ? 'filled' : ''}`}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            {/* Resend Code Section */}
            <div className="mt-5 mb-6 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Didn't receive the code?{' '}
                {countdown > 0 ? (
                  <span className="font-semibold text-slate-700">
                    Resend in <span className="font-mono text-[#00873E]">{countdown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResend}
                    className="font-semibold text-[#00873E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {resending && <RefreshCw size={12} className="animate-spin" />}
                    <span>Resend Code</span>
                  </button>
                )}
              </p>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="qh-auth-primary-btn !py-2.5"
            >
              {loading ? (
                <span>Verifying Credentials…</span>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Alternative Action */}
            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </form>
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
            d="M 150,0 C 320,180 400,120 480,380 C 560,640 680,680 800,800 L 800,0 Z"
            fill="rgba(0, 135, 62, 0.35)"
          />
          <path
            d="M 0,350 C 180,420 280,320 380,580 C 480,780 620,720 800,800 L 0,800 Z"
            fill="rgba(0, 77, 44, 0.4)"
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
            Institutional Verification
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
