import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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


export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { signIn, user, loading: authLoading, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Always redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam) {
        setLocation(redirectParam);
      } else if (isAdmin) {
        setLocation('/admin/overview');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [user, authLoading, isAdmin, setLocation]);

  // Show success toast if redirected from OTP verification
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verified') === 'true') {
        setSuccess('Account verified successfully! Please enter your credentials to log in.');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: signInError, unverifiedEmail } = await signIn(email.trim(), password);
      if (signInError) {
        if (signInError.message === 'ACCOUNT_NOT_VERIFIED' || unverifiedEmail) {
          setError(
            'Your account is not verified yet. A 6-digit confirmation code has been sent from admin@quick-hedgeconsulting.com. Redirecting to verification…'
          );
          setTimeout(() => {
            setLocation(
              `/verify-otp?email=${encodeURIComponent(unverifiedEmail || email.trim())}&reason=unverified`
            );
          }, 1400);
          return;
        }
        setError(signInError.message || 'Invalid authentication credentials. Please verify your details.');
      } else {
        setSuccess('Authentication verified. Redirecting to workspace...');
        // Authoritative role check: only true admins are ever routed to admin overview
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        let isAdminUser = false;
        if (currentUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle();
          isAdminUser = profileData?.role === 'admin';
        }

        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get('redirect');
          if (redirectParam) {
            setLocation(redirectParam);
          } else if (isAdminUser) {
            setLocation('/admin/overview');
          } else {
            setLocation('/dashboard');
          }
        }, 600);
      }
    } catch (err) {
      setError(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

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
      setError(err.message || `Unable to authenticate with ${provider}.`);
    }
  };


  return (
    <div className="qh-auth-page">
      {/* ======================================================== */}
      {/* LEFT SECTION: Clean, Crisp Authentication Form (White)   */}
      {/* ======================================================== */}
      <div className="qh-auth-form-side">
        <div className="qh-auth-form-inner">
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
              Log in to your account
            </h1>

            <p className="text-sm mt-2 font-medium" style={{ color: '#475569' }}>
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold hover:underline"
                style={{ color: '#00873E' }}
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="qh-auth-social-wrap">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="qh-auth-social-btn"
            >
              <GoogleIcon size={18} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Log in with Google</span>
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
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <span style={{ color: '#b91c1c' }}>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2.5 leading-relaxed">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span style={{ color: '#047857' }}>{success}</span>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="qh-auth-label"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="qh-auth-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="qh-auth-label !mb-0"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#00873E' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="qh-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="qh-auth-input qh-password-input"
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

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="qh-auth-primary-btn mt-5"
            >
              {loading ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <span>Next</span>
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
              'radial-gradient(ellipse at 85% 20%, rgba(0, 135, 62, 0.45) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(0, 104, 55, 0.6) 0%, transparent 60%), #001e2b',
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
            d="M 200,0 C 350,200 450,150 500,400 C 550,650 700,700 800,800 L 800,0 Z"
            fill="rgba(0, 135, 62, 0.35)"
          />
          <path
            d="M 0,400 C 150,450 300,350 400,600 C 500,800 650,750 800,800 L 0,800 Z"
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
