import { supabase } from './supabase';

export interface PendingOtpEntry {
  otp: string;
  expiresAt: number;
  createdAt: number;
}

// 1. Generate secure 6-digit OTP
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. Mark and Check Verification Status
export function markAccountVerified(email: string): void {
  try {
    const normalized = email.trim().toLowerCase();
    localStorage.setItem(`qh_verified_${normalized}`, 'true');
  } catch (err) {
    console.error('Error marking account as verified:', err);
  }
}

export function isEmailVerified(email?: string | null, userMetadata?: Record<string, any>): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // Admin users are always verified
  if (userMetadata?.role === 'admin') return true;

  // Supabase metadata or verification flag
  if (userMetadata?.is_verified === true) return true;
  if (localStorage.getItem(`qh_verified_${normalized}`) === 'true') return true;

  return false;
}

// 3. Verify OTP via Supabase Backend (Edge Function / RPC)
export async function verifyOtpCode(
  email: string,
  enteredCode: string,
  type: 'signup' | 'recovery' | 'verification' | 'email' = 'signup'
): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: 'Missing email address.' };
  }

  const normalized = email.trim().toLowerCase();
  const cleanCode = enteredCode.trim();

  // A. If standard signup and already marked verified
  if (type === 'signup' && isEmailVerified(normalized)) {
    return { success: true, message: 'Account is already verified.' };
  }

  // B. Supabase Backend Edge Function: verify-otp
  try {
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('verify-otp', {
      body: { email: normalized, code: cleanCode, type },
    });
    if (!edgeErr && (edgeData?.success || edgeData?.verified)) {
      if (type === 'signup') {
        markAccountVerified(normalized);
      }
      return { success: true, message: 'Code verified successfully!' };
    }
    if (edgeData?.error) {
      return { success: false, message: edgeData.error };
    }
    if (edgeErr) {
      try {
        const errJson = await (edgeErr as any).context?.json();
        if (errJson?.error) {
          return { success: false, message: errJson.error };
        }
      } catch {
        // ignore
      }
    }
  } catch (err: any) {
    console.warn('Supabase verify-otp Edge Function notice:', err?.message || err);
  }

  // C. Supabase Backend Database RPC: verify_email_otp
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_email_otp', {
      p_email: normalized,
      p_code: cleanCode,
      p_purpose: type === 'recovery' ? 'password_reset' : 'verification',
    });
    if (!rpcErr && rpcData?.success) {
      if (type === 'signup') {
        markAccountVerified(normalized);
      }
      return { success: true, message: 'Code verified successfully!' };
    }
    if (rpcData?.message) {
      return { success: false, message: rpcData.message };
    }
  } catch (err: any) {
    console.warn('Supabase verify_email_otp RPC notice:', err?.message || err);
  }

  return {
    success: false,
    message: 'Invalid or expired confirmation code. Please check your email or request a new one.',
  };
}

// 4. Dispatch OTP via Supabase Backend (Edge Function / RPC)
export async function sendVerificationOtpEmail(
  to: string,
  otp: string,
  fullName?: string,
  type: 'signup' | 'recovery' | 'verification' = 'signup'
): Promise<{ success: boolean; id?: string; error?: string }> {
  const normalizedTo = to.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  // 1. Supabase Backend Edge Function: send-otp
  try {
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('send-otp', {
      body: {
        to: normalizedTo,
        otp: cleanOtp,
        fullName: fullName || '',
        type,
      },
    });

    if (!edgeErr && (edgeData?.id || edgeData?.success)) {
      return { success: true, id: edgeData.id };
    }
    if (edgeErr || edgeData?.error) {
      const errMsg = edgeErr?.message || edgeData?.error;
      console.warn('Supabase Edge Function send-otp returned error:', errMsg);
    }
  } catch (edgeException: any) {
    console.warn('Supabase Edge Function send-otp call notice:', edgeException?.message || edgeException);
  }

  // 2. Supabase Backend Database RPC: request_email_otp
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('request_email_otp', {
      p_email: normalizedTo,
      p_purpose: type === 'recovery' ? 'password_reset' : 'verification',
    });

    if (!rpcErr && rpcData && rpcData.success) {
      return { success: true, id: rpcData.message || 'sent' };
    }
    if (rpcErr) {
      console.error('Supabase request_email_otp RPC error:', rpcErr);
      return { success: false, error: rpcErr.message };
    }
  } catch (rpcException: any) {
    console.error('Supabase request_email_otp RPC exception:', rpcException);
    return { success: false, error: rpcException?.message || 'Failed to dispatch email via Supabase backend.' };
  }

  return {
    success: false,
    error: 'Failed to dispatch OTP from Supabase backend. Please check your Supabase Edge Function deployment.',
  };
}
