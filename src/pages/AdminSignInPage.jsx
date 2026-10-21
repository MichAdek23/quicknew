import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import QuickHedgeLogo from '../components/QuickHedgeLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function AdminSignInPage() {
  const [, setLocation] = useLocation();
  const { user, isAdmin, signIn, signOut, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check if routed here due to unauthorized admin access attempt
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('denied')) {
      setError('Access Denied: Administrator authorization required. Non-admin accounts cannot access admin routes.');
    }
  }, []);

  // If already authenticated as an admin, redirect immediately to overview
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      setLocation('/admin/overview');
    }
  }, [user, isAdmin, authLoading, setLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error: signInError } = await signIn(cleanEmail, password);

      if (signInError) {
        setError(signInError.message || 'Invalid credentials. Access denied.');
        setSubmitting(false);
        return;
      }

      // Fetch the latest profile role from Supabase to guarantee admin privilege
      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (!authedUser) {
        setError('Authentication session could not be established.');
        setSubmitting(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authedUser.id)
        .maybeSingle();

      if (profileError || profileData?.role !== 'admin') {
        await signOut();
        setError('Access Denied: This account is not authorized with admin privileges.');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setLocation('/admin/overview');
    } catch (err) {
      setError(err?.message || 'An unexpected authentication error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#050505] px-6 py-12 relative overflow-hidden text-white">
      {/* Background Dot Matrix Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#222 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Header */}
        <div className="mb-10 text-center flex flex-col items-center">
          <Link href="/" className="mb-6 block hover:opacity-90 transition-opacity">
            <QuickHedgeLogo height={28} color="#ffffff" withAccent={true} />
          </Link>
          <h1
            className="font-serif text-3xl text-white tracking-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            Admin Sign In
          </h1>
          <p className="text-white/40 text-xs mt-2 font-sans tracking-widest uppercase">
            Authorized Personnel
          </p>
        </div>

        {/* Sign In Card */}
        <form
          onSubmit={handleSubmit}
          className="border border-[#222] bg-[#0c0c0c] p-7 sm:p-8 shadow-2xl rounded-2xl"
          aria-label="Admin sign-in"
        >
          <div className="flex items-center gap-2 text-white/60 mb-7">
            <Lock size={16} aria-hidden="true" className="text-[#00873E]" />
            <p className="text-sm">Sign in with your admin credentials</p>
          </div>

          {error && (
            <p role="alert" className="mb-5 text-xs leading-relaxed text-red-400 bg-red-950/30 border border-red-500/20 p-3 rounded-xl">
              {error}
            </p>
          )}

          <label
            htmlFor="admin-email"
            className="block text-[10px] uppercase tracking-widest text-white/60 mb-2 font-bold"
          >
            Email address
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@quick-hedgeconsulting.com"
            className="mb-6 w-full border border-[#222] bg-[#141414] px-3.5 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#00873E] transition-colors rounded-xl"
          />

          <label
            htmlFor="admin-password"
            className="block text-[10px] uppercase tracking-widest text-white/60 mb-2 font-bold"
          >
            Password
          </label>
          <div className="relative mb-6">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full border border-[#222] bg-[#141414] pl-3.5 pr-12 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#00873E] transition-colors rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-0 h-full px-3.5 text-white/40 hover:text-white flex items-center justify-center cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#00873E] py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#006837] transition-colors disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2 rounded-full"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <span>{submitting ? 'Authenticating…' : 'Sign in'}</span>
          </button>

          <p className="mt-6 text-xs leading-relaxed text-white/40 text-center">
            Protected access. Authorized administrators only.
          </p>
        </form>

        <Link
          href="/"
          className="mt-7 block text-center text-xs uppercase tracking-widest text-white/40 hover:text-[#00873E] transition-colors"
        >
          &larr; Back to QuickHedge
        </Link>
      </div>
    </div>
  );
}
