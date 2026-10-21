import { supabase } from './supabase';

export interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'image';
  url: string;
  thumbnail_url?: string | null;
  is_published: boolean;
  created_at?: string;
}

export interface QuizQuestion {
  id?: string;
  quiz_id?: string;
  question_text: string;
  options: string[];
  correct_option: number;
}

export interface Quiz {
  id: string;
  material_id?: string | null;
  title: string;
  published: boolean;
  is_archived?: boolean;
  created_at?: string;
  material?: Material | null;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total: number;
  passed: boolean;
  answers: Record<string, number>;
  created_at: string;
  user?: {
    full_name?: string;
    email?: string;
  };
  quiz?: {
    title?: string;
  };
}

export interface BlogPost {
  id: string;
  author_id?: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url?: string | null;
  published: boolean;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  author?: {
    full_name?: string;
  };
}

export const academicService = {
  // =========================================================================
  // 1. MATERIALS & CONTENT LIBRARY
  // =========================================================================
  async getMaterials(publishedOnly = false): Promise<Material[]> {
    let query = supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching materials:', error.message);
      return [];
    }
    return data || [];
  },

  async getMaterialById(id: string): Promise<Material | null> {
    const { data, error } = await supabase.from('materials').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data;
  },

  async uploadFileToStorage(file: File, folder = 'deployments'): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage.from('materials').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error('File upload exception:', err);
      return null;
    }
  },

  async createMaterial(params: {
    title: string;
    description?: string;
    type: 'pdf' | 'video' | 'image';
    url: string;
    thumbnail_url?: string | null;
    is_published?: boolean;
  }): Promise<{ success: boolean; data?: Material; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          title: params.title.trim(),
          description: params.description?.trim() || null,
          type: params.type,
          url: params.url.trim(),
          thumbnail_url: params.thumbnail_url || null,
          is_published: params.is_published ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create material.' };
    }
  },

  async updateMaterial(id: string, updates: Partial<Material>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('materials').update(updates).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteMaterial(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================================
  // 2. QUIZZES & QUIZ FORGE
  // =========================================================================
  async getQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, material:materials(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching quizzes:', error.message);
      return [];
    }
    return data || [];
  },

  async getQuizWithQuestions(quizId: string): Promise<Quiz | null> {
    try {
      const [quizRes, qRes] = await Promise.all([
        supabase.from('quizzes').select('*, material:materials(*)').eq('id', quizId).maybeSingle(),
        supabase.from('quiz_questions').select('*').eq('quiz_id', quizId),
      ]);

      if (!quizRes.data) return null;
      return {
        ...quizRes.data,
        questions: qRes.data || [],
      };
    } catch (err) {
      console.warn('Error fetching quiz details:', err);
      return null;
    }
  },

  async deployQuiz(params: {
    materialId?: string | null;
    title: string;
    questions: { question_text: string; options: string[]; correct_option: number }[];
  }): Promise<{ success: boolean; quiz_id?: string; error?: string }> {
    try {
      // 1. Try Supabase backend RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('deploy_quiz', {
        p_material_id: params.materialId || null,
        p_title: params.title.trim(),
        p_questions: params.questions,
      });

      if (!rpcError && rpcData?.success) {
        return { success: true, quiz_id: rpcData.quiz_id };
      }

      // 2. Direct Supabase insert fallback
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          material_id: params.materialId || null,
          title: params.title.trim(),
          published: true,
        })
        .select('id')
        .single();

      if (quizError || !quizData) throw quizError;

      const mappedQuestions = params.questions.map((q) => ({
        quiz_id: quizData.id,
        question_text: q.question_text.trim(),
        options: q.options,
        correct_option: Number(q.correct_option) || 0,
      }));

      const { error: questionsError } = await supabase.from('quiz_questions').insert(mappedQuestions);
      if (questionsError) throw questionsError;

      return { success: true, quiz_id: quizData.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to deploy quiz.' };
    }
  },

  async deleteQuiz(quizId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================================
  // 3. QUIZ ATTEMPTS & SCOREBOARD
  // =========================================================================
  async submitQuizAttempt(
    quizId: string,
    answers: Record<string, number>,
    localQuestions?: QuizQuestion[]
  ): Promise<{
    success: boolean;
    score?: number;
    total?: number;
    passed?: boolean;
    percentage?: number;
    error?: string;
  }> {
    try {
      // 1. Try authoritative Supabase RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_quiz_attempt', {
        p_quiz_id: quizId,
        p_answers: answers,
      });

      if (!rpcError && rpcData?.success) {
        return {
          success: true,
          score: rpcData.score,
          total: rpcData.total,
          passed: rpcData.passed,
          percentage: rpcData.percentage,
        };
      }

      // 2. Fallback direct computation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required to submit quiz attempt.');

      let questions = localQuestions;
      if (!questions || questions.length === 0) {
        const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId);
        questions = qData || [];
      }

      let score = 0;
      const total = questions.length;
      questions.forEach((q) => {
        if (q.id && answers[q.id] === q.correct_option) {
          score++;
        }
      });

      const passed = total > 0 ? score / total >= 0.7 : false;

      const { error: insertError } = await supabase.from('quiz_attempts').insert({
        quiz_id: quizId,
        user_id: user.id,
        score,
        total,
        passed,
        answers,
      });

      if (insertError) throw insertError;

      return {
        success: true,
        score,
        total,
        passed,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit quiz attempt.' };
    }
  },

  async getAllQuizAttempts(): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, user:profiles(full_name, email), quiz:quizzes(title)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all quiz attempts:', error.message);
      return [];
    }
    return data || [];
  },

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, quiz:quizzes(title, material:materials(title))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async deleteQuizAttempt(attemptId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('quiz_attempts').delete().eq('id', attemptId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================================
  // 4. BLOG ENGINE
  // =========================================================================
  async getBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
    let query = supabase.from('blog_posts').select('*, author:profiles(full_name)').order('created_at', { ascending: false });
    if (publishedOnly) {
      query = query.eq('published', true).eq('is_archived', false);
    } else {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching blog posts:', error.message);
      return [];
    }
    return data || [];
  },

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, author:profiles(full_name)')
      .eq('slug', slug)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  async upsertBlogPost(params: {
    id?: string;
    title: string;
    slug?: string;
    content: string;
    thumbnail_url?: string | null;
    published?: boolean;
  }): Promise<{ success: boolean; data?: BlogPost; error?: string }> {
    try {
      const cleanSlug =
        params.slug?.trim() ||
        params.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const payload = {
        title: params.title.trim(),
        slug: cleanSlug,
        content: params.content,
        thumbnail_url: params.thumbnail_url || null,
        published: params.published ?? false,
        updated_at: new Date().toISOString(),
      };

      if (params.id && params.id !== 'new') {
        const { data, error } = await supabase.from('blog_posts').update(payload).eq('id', params.id).select().single();
        if (error) throw error;
        return { success: true, data };
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('blog_posts')
          .insert({ ...payload, author_id: user?.id })
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save blog post.' };
    }
  },

  async deleteBlogPost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('blog_posts').update({ is_archived: true }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================================
  // 5. USER & STUDENT ROLES & SUBSCRIPTION TELEMETRY
  // =========================================================================
  async toggleUserRole(userId: string, targetRole: 'admin' | 'student'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('toggle_user_role', {
        p_user_id: userId,
        p_role: targetRole,
      });

      if (!rpcError && rpcData?.success) return { success: true };

      const { error } = await supabase.from('profiles').update({ role: targetRole }).eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleUserSubscription(userId: string, targetSubscribed: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('toggle_user_subscription', {
        p_user_id: userId,
        p_subscribed: targetSubscribed,
      });

      if (!rpcError && rpcData?.success) return { success: true };

      const { error } = await supabase.from('profiles').update({ is_subscribed: targetSubscribed }).eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================================
  // 6. PAYSTACK PAYMENTS & SUBSCRIPTIONS
  // =========================================================================
  async recordPaymentAndSubscribe(
    amount: number,
    reference: string,
    durationDays: number = 30
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('record_payment_and_subscribe', {
          p_amount: amount,
          p_reference: reference,
          p_duration_days: durationDays,
        });

        if (!rpcError && rpcData?.success) return { success: true };
      } catch (e) {
        console.warn('RPC record_payment_and_subscribe notice:', e);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User authentication required.');

      await Promise.all([
        supabase.from('payments').insert({
          user_id: user.id,
          amount,
          reference,
          status: 'success',
        }),
        supabase.from('profiles').update({
          is_subscribed: true,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id),
      ]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
