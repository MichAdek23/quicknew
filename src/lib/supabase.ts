import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing required Supabase environment variables! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const ADMIN_SECRET_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY || '';
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

// Storage helper for avatars and media files via Supabase backend
export async function uploadFile(
  file: File,
  bucket: string = 'avatars',
  customPath?: string
): Promise<string | null> {
  try {
    // 1. Try Supabase backend Edge Function upload-file
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (customPath) formData.append('fileName', customPath);

      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('upload-file', {
        body: formData,
      });

      if (!edgeErr && edgeData?.publicUrl) {
        return edgeData.publicUrl;
      }
    } catch (e) {
      console.warn('Backend upload-file Edge Function notice:', e);
    }

    // 2. Native Supabase Storage
    const fileExt = file.name.split('.').pop() || 'bin';
    const filePath = customPath || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('File upload exception:', err);
    return null;
  }
}

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  return uploadFile(file, 'avatars', `avatar-${userId}-${Date.now()}.${fileExt}`);
}

