import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Check, X, Loader2 } from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}


export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { signUp, user, loading: authLoading, isAdmin } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Live password matching state
  const hasConfirm = confirmPassword.length > 0;
  const passwordsMatch = Boolean(hasConfirm && password && password === confirmPassword);
  const passwordsMismatch = Boolean(hasConfirm && password !== confirmPassword);

  // Live username availability state
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameMessage, setUsernameMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Always redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      setLocation(isAdmin ? '/admin/overview' : '/dashboard');
    }
  }, [user, authLoading, isAdmin, setLocation]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60 font-mono text-sm">
          <Loader2 size={20} className="animate-spin text-[#00873E]" />
          <span>Redirecting to dashboard…</span>
        </div>
      </div>
    );
  }

  // Live debounced username availability check against Supabase
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('At least 3 characters');
      return;
    }

    if (!/^[a-z0-9_.]{3,20}$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Letters, numbers, _ or . only (max 20)');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        // 1. Try Supabase backend RPC function first
        const { data: rpcAvailable, error: rpcError } = await supabase.rpc('is_username_available', {
          p_username: clean,
        });

        if (!rpcError && typeof rpcAvailable === 'boolean') {
          if (rpcAvailable) {
            setUsernameStatus('available');
            setUsernameMessage('Username available');
          } else {
            setUsernameStatus('taken');
            setUsernameMessage('Username already taken');
          }
          return;
        }

        // 2. Fallback to profiles table query
        const { data: existingUser, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', clean)
          .maybeSingle();

        if (queryError) {
          // In case of network warning, keep optimistic
          setUsernameStatus('available');
          setUsernameMessage('Username available');
        } else if (existingUser) {
          setUsernameStatus('taken');
          setUsernameMessage('Username already taken');
        } else {
          setUsernameStatus('available');
          setUsernameMessage('Username available');
        }
      } catch (err) {
        console.warn('Live username check warning:', err);
        setUsernameStatus('idle');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first and last name.');
      return;
    }

    let cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Please choose a username. It cannot be left blank.');
      return;
    } else if (!/^[a-z0-9_.]{3,20}$/.test(cleanUsername)) {
      setError('Username must be 3-20 characters long and can only contain lowercase letters, numbers, underscores, and dots.');
      return;
    }

    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match before signing up.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('This username is already taken. Please choose another.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if username is already taken in profiles table
      try {
        const { data: existingUser, error: checkErr } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (!checkErr && existingUser) {
          setError('This username is already taken. Please choose another.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Username availability pre-check warning:', err);
      }

      const { error: signUpError } = await signUp(
        email.trim(),
        password,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: cleanUsername,
          fullName: `${firstName.trim()} ${lastName.trim()}`,
        }
      );

      if (signUpError) {
        setError(signUpError.message || 'Unable to register account. Please check your credentials.');
      } else {
        setSuccess('Account created! A 6-digit confirmation code has been sent to your email. Redirecting…');
        setTimeout(() => {
          setLocation(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
        }, 1000);
      }
    } catch (err) {
      setError(err?.message || 'An unexpected registration error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || `Unable to register with ${provider}.`);
    }
  };

  return (
    <div className="qh-auth-page">
      {/* ======================================================== */}
      {/* LEFT SECTION: Clean, Crisp Registration Form (White)     */}
      {/* ======================================================== */}
      <div className="qh-auth-form-side">
        <div className="qh-auth-form-inner max-w-[440px]">
          {/* Mobile-only Brand Logo */}
          <div className="lg:hidden mb-5">
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
          <div className="mb-4">
            <h1
              className="text-2xl sm:text-[30px] font-normal tracking-tight leading-tight qh-font-serif"
              style={{ color: '#001e2b' }}
            >
              Create your account
            </h1>

            <p className="text-xs sm:text-sm mt-1.5 font-medium" style={{ color: '#475569' }}>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: '#00873E' }}
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="qh-auth-social-wrap">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="qh-auth-social-btn !py-2.5"
            >
              <GoogleIcon size={18} />
              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '13.5px' }}>Sign up with Google</span>
            </button>
          </div>

          {/* Clearly Separated Divider */}
          <div className="qh-auth-divider">
            <div className="qh-auth-divider-line" />
            <span className="qh-auth-divider-text">
              Or with email and password
            </span>
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-firstname" className="qh-auth-label !mb-1">
                  First Name
                </label>
                <input
                  id="signup-firstname"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Adeleke"
                  className="qh-auth-input !py-2"
                />
              </div>

              <div>
                <label htmlFor="signup-lastname" className="qh-auth-label !mb-1">
                  Last Name
                </label>
                <input
                  id="signup-lastname"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Adeoye"
                  className="qh-auth-input !py-2"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signup-username" className="qh-auth-label !mb-0">
                  Username <span className="text-rose-500">*</span>
                </label>
                {usernameStatus === 'available' && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 transition-opacity">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Available
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 transition-opacity">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" /> Username taken
                  </span>
                )}
                {usernameStatus === 'checking' && (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> Checking...
                  </span>
                )}
                {usernameStatus === 'invalid' && (
                  <span className="text-[10px] text-amber-600 font-medium">
                    {usernameMessage}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm select-none pointer-events-none font-semibold">
                  @
                </span>
                <input
                  id="signup-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="adeleke_paul"
                  className={`qh-auth-input !py-2.5 pl-9 pr-10 font-mono text-xs transition-all ${
                    usernameStatus === 'available'
                      ? '!border-emerald-500 focus:!border-emerald-600 focus:!ring-1 focus:!ring-emerald-500/20'
                      : usernameStatus === 'taken'
                      ? '!border-rose-400 focus:!border-rose-500 focus:!ring-1 focus:!ring-rose-500/20'
                      : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs" title="Username available">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                  {usernameStatus === 'taken' && (
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-xs" title="Username taken">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="signup-email" className="qh-auth-label !mb-1">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="qh-auth-input !py-2"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="signup-password" className="qh-auth-label !mb-0">
                    Password
                  </label>
                  {password && password.length < 6 && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      Min. 6 chars
                    </span>
                  )}
                </div>
                <div className="qh-password-wrapper">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="qh-auth-input qh-password-input !py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="qh-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="signup-confirm-password" className="qh-auth-label !mb-0">
                    Confirm Password
                  </label>
                  {passwordsMatch && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" /> Mismatch
                    </span>
                  )}
                </div>
                <div className="qh-password-wrapper">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`qh-auth-input qh-password-input !py-2 transition-all ${
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
                    className="qh-password-toggle"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password mismatch notice */}
            {passwordsMismatch && (
              <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
                <AlertCircle size={14} className="shrink-0 text-rose-500" />
                <span>Password and Confirm Password must match before you can sign up.</span>
              </div>
            )}

            {/* Terms Agreement Checkbox (reduced text & separated) */}
            <div className="pt-3 mt-4 pb-1 border-t border-slate-100 flex items-center gap-2.5">
              <input
                id="signup-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer shrink-0"
                style={{ accentColor: '#00873E' }}
              />
              <label htmlFor="signup-terms" className="text-xs select-none cursor-pointer" style={{ color: '#475569' }}>
                I agree to the{' '}
                <a href="#" className="font-semibold hover:underline" style={{ color: '#00873E' }}>
                  Terms of Service
                </a>{' '}
                &{' '}
                <a href="#" className="font-semibold hover:underline" style={{ color: '#00873E' }}>
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className={`qh-auth-primary-btn !py-2.5 mt-2 transition-all ${
                passwordsMismatch ? '!opacity-50 !cursor-not-allowed !bg-slate-400 hover:!bg-slate-400' : ''
              }`}
              title={passwordsMismatch ? 'Password and Confirm Password must match before signing up' : ''}
            >
              {loading ? (
                <span>Registering Account…</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
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
