export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  role: UserRole;
  mat_number?: string | null;
  is_subscribed: boolean;
  subscription_expires_at?: string | null;
  is_verified?: boolean;
  avatar_url: string | null;
  username_changed_at?: string | null;
  created_at?: string;
  email?: string;
}

export interface PremiumPlanConfig {
  title: string;
  description: string;
  price_ngn: number;
  duration_days: number;
  covered_material_ids: string[];
  cover_all_materials?: boolean;
  is_active: boolean;
  updated_at?: string;
}

export interface SiteVideo {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  thumbnail_url?: string | null;
  sort_order: number;
  published: boolean;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  credentials?: string | null;
  title?: string | null;
  image_url: string;
  bio: string;
  section_label?: string | null;
  tags?: string | null;
  footer_label?: string | null;
  sort_order: number;
  published: boolean;
  created_at?: string;
}

export interface SiteCta {
  id: string;
  label: string;
  href: string;
  placement: 'navigation' | 'hero' | 'footer';
  variant: 'primary' | 'secondary';
  enabled: boolean;
  sort_order: number;
}

export type MaterialType = 'pdf' | 'video' | 'image';

export interface Material {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: MaterialType;
  thumbnail_url?: string | null;
  is_published?: boolean;
  created_at: string;
  completed?: boolean;
  last_accessed?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  material_id: string;
  completed: boolean;
  last_accessed: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id?: string;
  question_text: string;
  options: string[];
  correct_option: number;
  created_at?: string;
}

export interface Quiz {
  id: string;
  material_id: string;
  title: string;
  published: boolean;
  is_archived: boolean;
  created_at: string;
  material?: {
    id: string;
    title: string;
  };
  questions?: QuizQuestion[];
  question_count?: number;
  has_attempted?: boolean;
  latest_score?: number;
  latest_total?: number;
  passed?: boolean;
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
  quiz?: {
    title: string;
  };
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url?: string | null;
  published: boolean;
  is_archived: boolean;
  created_at: string;
  author?: {
    full_name: string;
  };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  parent_message_id?: string | null;
  reply_from?: 'user' | 'admin';
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  reference: string;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
  user?: {
    full_name: string;
    email?: string;
  };
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}
