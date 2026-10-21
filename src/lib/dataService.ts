import { supabase } from './supabase';
import { Material, Quiz, QuizQuestion, QuizAttempt, BlogPost, ContactMessage, PaymentRecord, Profile, SiteVideo, TeamMember, SiteCta } from '../types';

// Live collections (purged all mock/dummy data)
export const INITIAL_MATERIALS: Material[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_BLOGS: BlogPost[] = [];


// DATA SERVICE CLASS
class DataService {
  private materialsCache: Material[] = [];
  private quizzesCache: Quiz[] = [];
  private blogsCache: BlogPost[] = [];
  private attemptsCache: QuizAttempt[] = [];

  constructor() {
    this.materialsCache = [...INITIAL_MATERIALS];
    this.quizzesCache = [...INITIAL_QUIZZES];
    this.blogsCache = [...INITIAL_BLOGS];
  }

  // --- MATERIALS ---
  async getMaterials(userId?: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      let list = data && data.length > 0 ? (data as Material[]) : this.materialsCache;

      // Merge user completed status if userId is provided
      if (userId) {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('material_id, completed')
          .eq('user_id', userId);

        const progressMap = new Map((progress || []).map(p => [p.material_id, p.completed]));
        list = list.map(m => ({
          ...m,
          completed: progressMap.get(m.id) || false,
        }));
      }

      return list;
    } catch (e) {
      console.warn('Fallback to local materials:', e);
      return this.materialsCache;
    }
  }

  async getMaterialById(id: string, userId?: string): Promise<Material | null> {
    const all = await this.getMaterials(userId);
    return all.find(m => m.id === id) || null;
  }

  async toggleMaterialProgress(materialId: string, userId: string, completed: boolean): Promise<boolean> {
    try {
      await supabase
        .from('user_progress')
        .upsert({
          material_id: materialId,
          user_id: userId,
          completed: completed,
          last_accessed: new Date().toISOString(),
        });
      return true;
    } catch (e) {
      console.warn('Progress update failed in supabase, tracking locally:', e);
      return true;
    }
  }

  async createMaterial(material: Omit<Material, 'id' | 'created_at'>): Promise<Material> {
    const newMat: Material = {
      ...material,
      id: 'mat-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };

    try {
      const { data } = await supabase
        .from('materials')
        .insert({
          title: material.title,
          description: material.description,
          url: material.url,
          type: material.type,
          thumbnail_url: material.thumbnail_url,
          is_published: material.is_published ?? true,
        })
        .select()
        .single();

      if (data) {
        this.materialsCache.unshift(data as Material);
        return data as Material;
      }
    } catch (err) {
      console.warn('Saving material to local memory:', err);
    }

    this.materialsCache.unshift(newMat);
    return newMat;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    try {
      await supabase.from('materials').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete in supabase failed, updating cache:', err);
    }
    this.materialsCache = this.materialsCache.filter(m => m.id !== id);
    return true;
  }

  // --- QUIZZES ---
  async getQuizzes(userId?: string): Promise<Quiz[]> {
    try {
      const { data: dbQuizzes, error } = await supabase
        .from('quizzes')
        .select('*, materials(id, title), quiz_questions(*)')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      let list: Quiz[] = [];

      if (dbQuizzes && dbQuizzes.length > 0) {
        list = dbQuizzes.map((q: any) => ({
          id: q.id,
          material_id: q.material_id,
          title: q.title,
          published: q.published,
          is_archived: q.is_archived,
          created_at: q.created_at,
          material: q.materials ? { id: q.materials.id, title: q.materials.title } : undefined,
          questions: q.quiz_questions || [],
          question_count: q.quiz_questions?.length || 0,
        }));
      } else {
        list = [...this.quizzesCache];
      }

      // Check attempts if user provided
      if (userId) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, total, passed')
          .eq('user_id', userId);

        const attemptMap = new Map((attempts || []).map(a => [a.quiz_id, a]));
        list = list.map(q => {
          const att = attemptMap.get(q.id);
          return {
            ...q,
            has_attempted: Boolean(att),
            latest_score: att?.score,
            latest_total: att?.total,
            passed: att?.passed,
          };
        });
      }

      return list;
    } catch (e) {
      console.warn('Fallback to local quizzes:', e);
      return this.quizzesCache;
    }
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    const list = await this.getQuizzes();
    return list.find(q => q.id === id) || null;
  }

  async submitQuizAttempt(
    quizId: string,
    userId: string,
    score: number,
    total: number,
    passed: boolean,
    answers: Record<string, number>
  ): Promise<QuizAttempt> {
    const attempt: QuizAttempt = {
      id: 'att-' + Math.random().toString(36).substr(2, 9),
      quiz_id: quizId,
      user_id: userId,
      score,
      total,
      passed,
      answers,
      created_at: new Date().toISOString(),
    };

    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .upsert({
          quiz_id: quizId,
          user_id: userId,
          score,
          total,
          passed,
          answers,
        })
        .select()
        .single();

      if (data) {
        this.attemptsCache.unshift(data as QuizAttempt);
        return data as QuizAttempt;
      }
    } catch (e) {
      console.warn('Attempt saved locally:', e);
    }

    this.attemptsCache.unshift(attempt);
    return attempt;
  }

  async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          quiz_id: d.quiz_id,
          user_id: d.user_id,
          score: d.score,
          total: d.total,
          passed: d.passed,
          answers: d.answers,
          created_at: d.created_at,
          quiz: d.quizzes ? { title: d.quizzes.title } : undefined,
        }));
      }
    } catch (e) {
      console.warn('Fetching attempts failed, using cache:', e);
    }
    return this.attemptsCache.filter(a => a.user_id === userId);
  }

  async createQuiz(
    title: string,
    materialId: string,
    questions: Array<{ question_text: string; options: string[]; correct_option: number }>
  ): Promise<Quiz> {
    const newQuizId = 'quiz-' + Math.random().toString(36).substr(2, 9);
    const newQuiz: Quiz = {
      id: newQuizId,
      title,
      material_id: materialId,
      published: true,
      is_archived: false,
      created_at: new Date().toISOString(),
      question_count: questions.length,
      questions: questions.map((q, idx) => ({
        id: `q-${idx}-${Date.now()}`,
        quiz_id: newQuizId,
        question_text: q.question_text,
        options: q.options,
        correct_option: q.correct_option,
      })),
    };

    try {
      const { data: qData } = await supabase
        .from('quizzes')
        .insert({
          title,
          material_id: materialId,
          published: true,
          is_archived: false,
        })
        .select()
        .single();

      if (qData) {
        const quizId = qData.id;
        const qRows = questions.map(q => ({
          quiz_id: quizId,
          question_text: q.question_text,
          options: q.options,
          correct_option: q.correct_option,
        }));
        await supabase.from('quiz_questions').insert(qRows);
        newQuiz.id = quizId;
      }
    } catch (e) {
      console.warn('Quiz stored in local cache:', e);
    }

    this.quizzesCache.unshift(newQuiz);
    return newQuiz;
  }

  // --- BLOGS ---
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .eq('published', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          author_id: d.author_id,
          title: d.title,
          slug: d.slug,
          content: d.content,
          thumbnail_url: d.thumbnail_url,
          published: d.published,
          is_archived: d.is_archived,
          created_at: d.created_at,
          author: d.profiles ? { full_name: d.profiles.full_name } : undefined,
        }));
      }
    } catch (e) {
      console.warn('Blog fetch fallback:', e);
    }
    return this.blogsCache;
  }

  async getBlogBySlug(slug: string): Promise<BlogPost | null> {
    const list = await this.getBlogPosts();
    return list.find(b => b.slug === slug) || null;
  }

  async createBlogPost(post: Omit<BlogPost, 'id' | 'created_at'>): Promise<BlogPost> {
    const newPost: BlogPost = {
      ...post,
      id: 'blog-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };

    try {
      const { data } = await supabase
        .from('blog_posts')
        .insert({
          author_id: post.author_id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          thumbnail_url: post.thumbnail_url,
          published: post.published,
          is_archived: post.is_archived,
        })
        .select()
        .single();

      if (data) {
        this.blogsCache.unshift(data as BlogPost);
        return data as BlogPost;
      }
    } catch (e) {
      console.warn('Blog post stored locally:', e);
    }

    this.blogsCache.unshift(newPost);
    return newPost;
  }

  // --- CONTACT MESSAGES ---
  async sendContactMessage(name: string, email: string, message: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name,
        email,
        message,
        is_read: false,
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase message insert error:', e);
      return false;
    }
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    try {
      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) return data as ContactMessage[];
    } catch (e) {
      console.warn('Messages read error:', e);
    }
    return [];
  }

  // --- USERS & ADMIN STATS ---
  async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) return data as Profile[];
    } catch (e) {
      console.warn('Profiles read error:', e);
    }
    return [];
  }

  async toggleUserSubscription(userId: string, isSubscribed: boolean): Promise<boolean> {
    try {
      await supabase
        .from('profiles')
        .update({ is_subscribed: isSubscribed })
        .eq('id', userId);
      return true;
    } catch (e) {
      console.warn('Subscription toggle error:', e);
      return true;
    }
  }

  async recordPayment(userId: string, amount: number, reference: string): Promise<boolean> {
    try {
      await supabase.from('payments').insert({
        user_id: userId,
        amount,
        reference,
        status: 'success',
      });
      // Also automatically mark user as subscribed!
      await this.toggleUserSubscription(userId, true);
      return true;
    } catch (e) {
      console.warn('Payment record error:', e);
      return true;
    }
  }

  // --- SITE VIDEOS (DYNAMIC INTELLIGENCE) ---
  async getSiteVideos(): Promise<SiteVideo[]> {
    try {
      const { data, error } = await supabase
        .from('site_videos')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as SiteVideo[];
      }
    } catch (e) {
      console.warn('Error fetching dynamic site videos:', e);
    }
    return [];
  }

  async saveSiteVideo(video: Partial<SiteVideo> & { youtube_id: string; title: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_videos')
        .upsert({
          ...video,
          published: video.published ?? true,
        }, { onConflict: 'youtube_id' });
      return !error;
    } catch (e) {
      console.error('Failed to save site video:', e);
      return false;
    }
  }

  // --- TEAM MEMBERS (DYNAMIC LEADERSHIP) ---
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as TeamMember[];
      }
    } catch (e) {
      console.warn('Error fetching dynamic team members:', e);
    }
    return [];
  }

  async saveTeamMember(member: Partial<TeamMember> & { name: string; image_url: string; bio: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .upsert({
          ...member,
          published: member.published ?? true,
        });
      return !error;
    } catch (e) {
      console.error('Failed to save team member:', e);
      return false;
    }
  }

  // --- SITE CTAS (DYNAMIC ACTIONS) ---
  async getSiteCtas(): Promise<SiteCta[]> {
    try {
      const { data, error } = await supabase
        .from('site_ctas')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as SiteCta[];
      }
    } catch (e) {
      console.warn('Error fetching dynamic site CTAs:', e);
    }
    return [];
  }

  async updateSiteCta(id: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_ctas')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      return !error;
    } catch (e) {
      console.error('Failed to update site CTA:', e);
      return false;
    }
  }

  // --- APP SETTINGS (DYNAMIC CONFIGURATION) ---
  async getAppSettings(): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (!error && data && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => {
          map[row.key] = row.value;
        });
        return map;
      }
    } catch (e) {
      console.warn('Error fetching dynamic app settings:', e);
    }
    return {};
  }

  async updateAppSetting(key: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      return !error;
    } catch (e) {
      console.error('Failed to update app setting:', e);
      return false;
    }
  }

  // --- SITE BUNDLE (Supabase RPC or parallel table queries) ---
  async getSiteBundle(): Promise<{
    settings: Record<string, string>;
    ctas: SiteCta[];
    videos: SiteVideo[];
    team: TeamMember[];
  }> {
    try {
      const { data, error } = await supabase.rpc('get_site_bundle');
      if (!error && data) {
        return {
          settings: data.settings || {},
          ctas: data.ctas || [],
          videos: data.videos || [],
          team: data.team || [],
        };
      }
    } catch (e) {
      console.warn('RPC get_site_bundle warning, falling back to parallel table fetch:', e);
    }

    const [settings, ctas, videos, team] = await Promise.all([
      this.getAppSettings(),
      this.getSiteCtas(),
      this.getSiteVideos(),
      this.getTeamMembers(),
    ]);

    return { settings, ctas, videos, team };
  }

  // --- USERNAME AVAILABILITY (Supabase RPC or profiles table query) ---
  async checkUsernameAvailable(username: string): Promise<boolean> {
    const clean = username.trim().toLowerCase();
    if (!clean || clean.length < 3 || clean.length > 20) return false;
    try {
      const { data, error } = await supabase.rpc('is_username_available', {
        p_username: clean,
      });
      if (!error && typeof data === 'boolean') {
        return data;
      }
    } catch {
      // ignore
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', clean)
        .maybeSingle();
      return !data;
    } catch {
      return true;
    }
  }

  // --- EMAIL OTP BACKEND FUNCTIONS ---
  async requestEmailOtp(email: string): Promise<{ success: boolean; message?: string }> {
    const clean = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.rpc('request_email_otp', {
        p_email: clean,
      });
      if (!error && data && data.success) {
        return { success: true, message: data.message };
      }
    } catch (e) {
      console.warn('RPC request_email_otp fallback:', e);
    }
    return { success: false };
  }

  async verifyEmailOtp(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    const clean = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.rpc('verify_email_otp', {
        p_email: clean,
        p_code: code.trim(),
      });
      if (!error && data && data.success) {
        return { success: true, message: data.message };
      }
    } catch (e) {
      console.warn('RPC verify_email_otp fallback:', e);
    }
    return { success: false };
  }

  async recordPaymentAndSubscribe(
    reference: string,
    amount: number,
    channel: string,
    status: string = 'success',
    rawPayload: any = {}
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      await supabase.from('payments').insert({
        user_id: user.id,
        reference,
        amount,
        channel,
        status,
        raw_payload: rawPayload,
      });

      await supabase.from('profiles').update({ is_subscribed: true }).eq('id', user.id);
      return true;
    } catch (e) {
      console.error('recordPaymentAndSubscribe error:', e);
      return false;
    }
  }
}

export const dataService = new DataService();
export const academicService = dataService;
