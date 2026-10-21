import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, ADMIN_SECRET_KEY } from '../lib/supabase';
import { Profile } from '../types';
import {
  generateOtp,
  sendVerificationOtpEmail,
  verifyOtpCode,
  isEmailVerified,
  markAccountVerified,
} from '../lib/emailService';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSubscribed: boolean;
  isVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; unverifiedEmail?: string }>;
  signUp: (
    email: string,
    password: string,
    userData: string | { firstName: string; lastName: string; username?: string; fullName?: string }
  ) => Promise<{ error: Error | null; data?: any }>;
  signUpAdmin: (email: string, password: string, fullName: string, secretKey: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string, type?: 'signup' | 'email' | 'recovery') => Promise<{ error: Error | null; data?: any }>;
  resendOtp: (email: string, type?: 'signup' | 'recovery' | 'verification' | 'email_change') => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null; otp?: string }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updatePasswordWithOtp: (email: string, code: string, newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  changeUsername: (newUsername: string) => Promise<{ success: boolean; error?: Error; message?: string; nextEligibleAt?: string }>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; reason?: string }>;
}

export function generateDefaultUsername(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  let base = (firstName && lastName ? `${firstName}_${lastName}` : firstName || email?.split('@')[0] || 'member')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '');
  if (base.length < 3) base = base.padEnd(3, '0');
  if (base.length > 14) base = base.substring(0, 14);
  const rand = Math.floor(100 + Math.random() * 900);
  return `${base}${rand}`.substring(0, 20);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or construct profile strictly from real database
  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch note:', error.message);
      }

      if (data) {
        let finalUsername = data.username;
        if (!finalUsername) {
          finalUsername = generateDefaultUsername(data.first_name, data.last_name, email || data.email);
          // Persist generated username back to profiles
          supabase.from('profiles').update({ username: finalUsername }).eq('id', userId).then(() => {});
        }
        setProfile({
          ...data,
          username: finalUsername,
          email: email || data.email,
        });
      } else {
        // Fallback default profile if row hasn't generated yet
        const genUsername = generateDefaultUsername(null, null, email);
        const defaultProfile: Profile = {
          id: userId,
          full_name: email?.split('@')[0] || 'User',
          first_name: email?.split('@')[0] || 'User',
          last_name: '',
          username: genUsername,
          role: 'student',
          is_subscribed: false,
          is_verified: false,
          avatar_url: null,
          email: email,
        };
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Purge any legacy demo artifacts from browser storage
    localStorage.removeItem('quickedge_demo_role');
    localStorage.removeItem('quickhedge_admin_auth');

    // 1. Initial live session load
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Realtime auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Realtime profile changes subscription (Instant updates for subscriptions, roles, avatar, etc.)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`public:profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const updated = payload.new as Profile;
            setProfile((prev) => ({
              ...(prev || {}),
              ...updated,
              email: updated.email || prev?.email || user.email,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Enforce: only verified accounts can log in and use the application
        const verified = isEmailVerified(data.user.email, data.user.user_metadata);

        if (!verified) {
          // Unverified account: generate fresh OTP and dispatch via Supabase backend
          const freshOtp = generateOtp();
          await sendVerificationOtpEmail(
            normalizedEmail,
            freshOtp,
            data.user.user_metadata?.full_name
          );

          // Sign out immediately so unverified session is never active
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);

          return {
            error: new Error('ACCOUNT_NOT_VERIFIED'),
            unverifiedEmail: normalizedEmail,
          };
        }

        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: string | { firstName: string; lastName: string; username?: string; fullName?: string }
  ) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      let firstName = '';
      let lastName = '';
      let username = '';
      let fullName = '';

      if (typeof userData === 'string') {
        fullName = userData.trim();
        const parts = fullName.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ').trim();
      } else if (userData && typeof userData === 'object') {
        firstName = (userData.firstName || '').trim();
        lastName = (userData.lastName || '').trim();
        username = (userData.username || '').trim().toLowerCase();
        fullName = userData.fullName || `${firstName} ${lastName}`.trim();
      }

      if (!username) {
        username = generateDefaultUsername(firstName, lastName, normalizedEmail);
      }

      // 1. Invoke Supabase backend Edge Function to create account, insert profile, and dispatch OTP
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('create-account', {
          body: {
            email: normalizedEmail,
            password,
            firstName,
            lastName,
            username: username || undefined,
            fullName,
            role: 'student',
          },
        });

        if (!edgeErr && edgeData?.success) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return { error: null, data: { email: normalizedEmail } };
        }

        if (edgeData?.error) {
          return { error: new Error(edgeData.error), data: null };
        }
      } catch (edgeException: any) {
        console.warn('Supabase backend create-account notice, trying direct auth:', edgeException);
      }

      // 2. Direct Supabase Auth registration
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            username: username || undefined,
            role: 'student',
            is_verified: false,
          },
        },
      });

      if (error) return { error, data: null };

      // Dispatch confirmation code via Supabase backend
      const otp = generateOtp();
      await sendVerificationOtpEmail(normalizedEmail, otp, fullName || firstName);

      // Make sure unverified account does NOT have an active session yet
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);

      return { error: null, data: { email: normalizedEmail, otp } };
    } catch (err) {
      return { error: err as Error, data: null };
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'email' | 'recovery' = 'signup') => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Verify via Supabase Backend Edge Function: verify-otp
      const result = await verifyOtpCode(normalizedEmail, token.trim(), type);

      if (result.success) {
        markAccountVerified(normalizedEmail);

        // If a user session is active, update user metadata in Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.auth.updateUser({
            data: { is_verified: true },
          });
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        }

        return { error: null, data: { verified: true } };
      }

      // 2. Try Supabase backend Database RPC: verify_email_otp
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_email_otp', {
          p_email: normalizedEmail,
          p_code: token.trim(),
          p_purpose: type === 'recovery' ? 'password_reset' : 'verification',
        });
        if (!rpcErr && rpcData && rpcData.success) {
          if (type === 'signup') {
            markAccountVerified(normalizedEmail);
          }
          return { error: null, data: { verified: true } };
        }
      } catch (e) {
        console.warn('Backend verify_email_otp RPC notice:', e);
      }

      if (!result.success) {
        // Fallback: check Supabase native OTP in case
        const { data: supaData, error: supaErr } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: token.trim(),
          type,
        });

        if (!supaErr && supaData?.user) {
          markAccountVerified(normalizedEmail);
          setUser(supaData.user);
          await fetchProfile(supaData.user.id, supaData.user.email);
          return { error: null, data: supaData };
        }

        return { error: new Error(result.message), data: null };
      }

      // Successfully verified
      markAccountVerified(normalizedEmail);

      // If a user session is active, update user metadata in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { is_verified: true },
        });
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      }

      return { error: null, data: { verified: true } };
    } catch (err) {
      return { error: err as Error, data: null };
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'recovery' | 'verification' | 'email_change' = 'signup') => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const freshOtp = generateOtp();
      const res = await sendVerificationOtpEmail(
        normalizedEmail,
        freshOtp,
        '',
        type === 'recovery' ? 'recovery' : 'signup'
      );
      if (!res.success) {
        return { error: new Error(res.error || 'Failed to dispatch email via Supabase backend') };
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpAdmin = async (email: string, password: string, fullName: string, secretKey: string) => {
    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ').trim();
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Invoke Supabase backend function to verify secretKey and register admin account
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('create-account', {
          body: {
            email: normalizedEmail,
            password,
            fullName,
            firstName,
            lastName,
            role: 'admin',
            secretKey,
          },
        });

        if (!edgeErr && edgeData?.success) {
          // Sign in automatically
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (signInErr) return { error: signInErr };
          if (signInData.user) {
            setUser(signInData.user);
            await fetchProfile(signInData.user.id, signInData.user.email);
          }
          return { error: null };
        }

        if (edgeData?.error) {
          return { error: new Error(edgeData.error) };
        }
      } catch (edgeException: any) {
        console.warn('Backend create-account invoke notice:', edgeException);
      }

      // 2. Direct client fallback
      if (secretKey !== ADMIN_SECRET_KEY) {
        return { error: new Error('Invalid Admin Secret Passkey') };
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role: 'admin',
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        setUser(data.user);
        const adminProfile: Profile = {
          id: data.user.id,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          is_subscribed: true,
          is_verified: true,
          avatar_url: null,
          email: normalizedEmail,
        };
        await supabase.from('profiles').upsert(adminProfile);
        setProfile(adminProfile);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error('No profile active') };
    try {
      const updated = { ...profile, ...updates };
      setProfile(updated);

      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (error) throw error;
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Generate 6-digit OTP
      const otp = generateOtp();

      // 2. Dispatch recovery code via Supabase backend
      const res = await sendVerificationOtpEmail(normalizedEmail, otp, '', 'recovery');
      if (!res.success) {
        return { error: new Error(res.error || 'Failed to dispatch recovery code via Supabase backend') };
      }

      return { error: null, otp };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updatePasswordWithOtp = async (email: string, code: string, newPassword: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Try Supabase Edge Function (Production Backend)
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('reset-password', {
          body: { email: normalizedEmail, code: code.trim(), newPassword },
        });
        if (!edgeErr && edgeData?.success) {
          return { error: null };
        }
      } catch (e) {
        console.warn('Supabase Edge Function reset-password notice:', e);
      }

      // 2. Try Supabase Database RPC
      try {
        const { data, error } = await supabase.rpc('reset_user_password', {
          p_email: normalizedEmail,
          p_code: code.trim(),
          p_new_password: newPassword,
        });
        if (!error && data && data.success) {
          return { error: null };
        }
      } catch (e) {
        console.warn('Supabase reset_user_password RPC notice:', e);
      }

      // 3. Also try supabase.auth.updateUser if session active
      const { error: userError } = await supabase.auth.updateUser({ password: newPassword });
      if (!userError) return { error: null };

      return { error: new Error('Unable to reset password. Please check your confirmation code or request a new one.') };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const checkUsernameAvailability = async (desiredUsername: string) => {
    const clean = desiredUsername.trim().toLowerCase().replace(/^@+/, '');
    if (!clean) return { available: false, reason: 'Username cannot be blank.' };
    if (!/^[a-z0-9_.]{3,20}$/.test(clean)) {
      return { available: false, reason: 'Must be 3–20 characters using lowercase letters, numbers, underscores, or dots.' };
    }

    try {
      // 1. Try database RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('check_username_availability', {
        p_username: clean,
        p_user_id: user?.id || null,
      });

      if (!rpcErr && rpcData) {
        return {
          available: Boolean(rpcData.available),
          reason: rpcData.reason,
        };
      }
    } catch (e) {
      console.warn('RPC check_username_availability notice:', e);
    }

    // 2. Direct database query fallback
    try {
      let query = supabase.from('profiles').select('id').ilike('username', clean);
      if (user?.id) query = query.neq('id', user.id);
      const { data: existing, error } = await query.maybeSingle();
      if (!error && existing) {
        return { available: false, reason: 'This username is already taken. Please choose another.' };
      }
      return { available: true, reason: 'Username is available.' };
    } catch (err: any) {
      return { available: false, reason: err?.message || 'Error checking availability.' };
    }
  };

  const changeUsername = async (newUsername: string) => {
    if (!user) return { success: false, error: new Error('You must be logged in to change your username.') };
    const clean = newUsername.trim().toLowerCase().replace(/^@+/, '');

    if (!/^[a-z0-9_.]{3,20}$/.test(clean)) {
      return {
        success: false,
        error: new Error('Username must be 3–20 characters long and can only contain lowercase letters, numbers, underscores, and dots.'),
      };
    }

    // 1. Try Supabase Edge Function
    try {
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('change-username', {
        body: { username: clean },
      });
      if (!edgeErr && edgeData?.success) {
        await fetchProfile(user.id, user.email);
        return { success: true, message: edgeData.message || 'Username changed successfully.' };
      }
      if (edgeData?.error) {
        return { success: false, error: new Error(edgeData.error), nextEligibleAt: edgeData.next_eligible_at };
      }
    } catch (edgeEx) {
      console.warn('Edge function change-username notice:', edgeEx);
    }

    // 2. Try Supabase Database RPC: change_username
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('change_username', {
        p_new_username: clean,
      });

      if (!rpcErr && rpcData) {
        if (rpcData.success) {
          await fetchProfile(user.id, user.email);
          return { success: true, message: rpcData.message || 'Username changed successfully.' };
        }
        if (rpcData.error) {
          return { success: false, error: new Error(rpcData.error), nextEligibleAt: rpcData.next_eligible_at };
        }
      }
      if (rpcErr) {
        return { success: false, error: new Error(rpcErr.message) };
      }
    } catch (rpcEx: any) {
      console.warn('RPC change_username notice:', rpcEx);
      return { success: false, error: new Error(rpcEx?.message || 'Failed to update username.') };
    }

    // 3. Fallback client-level 2-month cooldown & availability enforcement
    if (profile?.username_changed_at) {
      const lastChanged = new Date(profile.username_changed_at).getTime();
      const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
      const nextAllowed = new Date(lastChanged + sixtyDaysMs);
      if (Date.now() < nextAllowed.getTime()) {
        const dateStr = nextAllowed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return {
          success: false,
          error: new Error(`You can only change your username once every 2 months. You will be eligible to change it again on ${dateStr}.`),
        };
      }
    }

    // Availability check fallback
    const { data: existing } = await supabase.from('profiles').select('id').ilike('username', clean).neq('id', user.id).maybeSingle();
    if (existing) {
      return { success: false, error: new Error(`The username "@${clean}" is already taken. Please choose another.`) };
    }

    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ username: clean, username_changed_at: nowIso, updated_at: nowIso })
      .eq('id', user.id);

    if (updErr) return { success: false, error: updErr };

    await supabase.auth.updateUser({ data: { username: clean } });
    await fetchProfile(user.id, user.email);
    return { success: true, message: `Username updated to @${clean}.` };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out message:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isSubscriptionActive = Boolean(
    profile?.is_subscribed &&
    (!profile.subscription_expires_at || new Date(profile.subscription_expires_at).getTime() > Date.now())
  );
  const isSubscribed = Boolean(isSubscriptionActive || isAdmin);
  const isVerified = isEmailVerified(user?.email, user?.user_metadata) || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isSubscribed,
        isVerified,
        signIn,
        signUp,
        signUpAdmin,
        verifyOtp,
        resendOtp,
        resetPassword,
        updatePassword,
        updatePasswordWithOtp,
        signOut,
        updateProfile,
        refreshProfile,
        changeUsername,
        checkUsernameAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
