import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { updatePassword, updatePasswordWithOtp } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || sessionStorage.getItem(`qh_recovery_token_${emailParam.toLowerCase()}`) || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Live password matching state
  const hasConfirm = confirmPassword.length > 0;
  const passwordsMatch = Boolean(hasConfirm && password && password === confirmPassword);
  const passwordsMismatch = Boolean(hasConfirm && password !== confirmPassword);

  // Password strength calculation
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#3b82f6', '#00873E'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please provide a new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your input.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (emailParam && tokenParam) {
        const { error: updateError } = await updatePasswordWithOtp(emailParam, tokenParam, password);
        if (updateError) {
          setError(updateError.message || 'Unable to update password. Please check your recovery token or try again.');
        } else {
          sessionStorage.removeItem(`qh_recovery_token_${emailParam.toLowerCase()}`);
          setSuccess(true);
        }
      } else {
        const { error: updateError } = await updatePassword(password);
        if (updateError) {
          setError(updateError.message || 'Unable to update password. Please check your recovery token or try again.');
        } else {
          setSuccess(true);
        }
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qh-auth-page">
      {/* ======================================================== */}
      {/* LEFT SECTION: Clean, Crisp Password Reset Form (White)   */}
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
              Set a new password
            </h1>

            <p className="text-sm mt-2 font-medium" style={{ color: '#475569' }}>
              Remembered your old password?{' '}
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
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#001e2b' }}>Password Updated</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#334155' }}>
                Your passphrase has been securely renewed. You can now authenticate with your updated credentials.
              </p>
              <button
                type="button"
                onClick={() => setLocation('/login')}
                className="qh-auth-primary-btn text-center block"
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                Choose a strong passphrase with at least 8 characters, numbers, and symbols.
              </p>

              <div>
                <label
                  htmlFor="new-password"
                  className="qh-auth-label"
                >
                  New Password
                </label>
                <div className="qh-password-wrapper">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="qh-auth-input qh-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="qh-password-toggle"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5 h-1.5">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className="flex-1 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              step < strengthScore ? strengthColors[strengthScore - 1] : '#e2e8f0',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[10px]" style={{ color: '#64748b' }}>
                      <span>Strength</span>
                      <span
                        className="font-semibold uppercase tracking-wider"
                        style={{
                          color:
                            strengthScore > 0 ? strengthColors[strengthScore - 1] : '#94a3b8',
                        }}
                      >
                        {strengthScore > 0 ? strengthLabels[strengthScore - 1] : 'Too Short'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="confirm-password"
                    className="qh-auth-label !mb-0"
                  >
                    Confirm New Password
                  </label>
                  {passwordsMatch && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Passwords match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" /> Passwords do not match
                    </span>
                  )}
                </div>
                <div className="qh-password-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`qh-auth-input qh-password-input transition-all ${
                      passwordsMatch
                        ? '!border-emerald-500 focus:!border-emerald-600 focus:!ring-1 focus:!ring-emerald-500/20'
                        : passwordsMismatch
                        ? '!border-rose-400 focus:!border-rose-500 focus:!ring-1 focus:!ring-rose-500/20'
                        : ''
                    }`}
                  />
                  {passwordsMatch && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 flex items-center" title="Passwords match">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  )}
                  {passwordsMismatch && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none text-rose-600 flex items-center" title="Passwords do not match">
                      <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="qh-password-toggle"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password mismatch alert */}
              {passwordsMismatch && (
                <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
                  <AlertCircle size={14} className="shrink-0 text-rose-500" />
                  <span>Passwords must match before you can reset your password.</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || passwordsMismatch}
                className={`qh-auth-primary-btn mt-2 transition-all ${
                  passwordsMismatch ? '!opacity-50 !cursor-not-allowed !bg-slate-400 hover:!bg-slate-400' : ''
                }`}
                title={passwordsMismatch ? 'Passwords must match before submitting' : ''}
              >
                {loading ? (
                  <span>Updating Passphrase…</span>
                ) : (
                  <>
                    <span>Reset Password</span>
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
                  <span>Cancel and back to login</span>
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
