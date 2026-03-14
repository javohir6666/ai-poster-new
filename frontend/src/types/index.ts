export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface Channel {
  id: number;
  userId: number;
  channelUsername: string;
  name: string;
  aiModel: string;
  aiModelId?: number | null;
  ai_model?: number | null;
  customPrompt: string;
  status: string;
  isAdminVerified: boolean;
  telegramChatId?: number | null;
  telegramType?: string;
}

export interface AIModel {
  id: number;
  name: string;
  provider: "gemini" | "openai" | "custom";
  model?: string;
  base_url?: string;
  is_active?: boolean;
}

export interface Stats {
  totalChannels: number;
  activeBots: number;
  totalPosts: number;
  aiInteractions: number;
}

export interface ChannelAnalytics {
  channelId: number;
  postsToday: number;
  totalPosts: number;
  subscribersGained: number;
  aiTokensUsed: number;
  lastPostAt: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  message?: string;
}

export interface CronJob {
  id: number;
  channelId: number;
  schedule: string;
  topic: string;
  with_images?: boolean;
  status: string;
  nextRun?: string | null;
  lastRunAt?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PostLog {
  id: number;
  channelId: number;
  cronJobId?: number | null;
  topic: string;
  content: string;
  status: "success" | "failed";
  error?: string;
  telegram_message_id?: number | null;
  created_at: string;
  posted_at?: string | null;
}


export interface Post {
  id: number;
  channelId: number;
  cronJobId?: number | null;
  title: string;
  category: string;
  text_plain: string;
  text_html: string;
  media?: string;
  images?: PostImage[];
  telegram_message_id?: number | null;
  status: string;
  error?: string;
  created_at: string;
  posted_at?: string | null;
}


export interface PostImage {
  id: number;
  prompt: string;
  provider: string;
  sha256?: string;
  url?: string | null;
  created_at: string;
}


export interface DailyMetric {
  date: string;
  runs_total: number;
  runs_success: number;
  runs_failed: number;
  posts_published: number;
  tokens_total: number;
  duration_total_ms: number;
}

export interface RunError {
  id: number;
  channelId: number;
  cronJobId?: number | null;
  postId?: number | null;
  status: string;
  error?: string;
  started_at: string;
  finished_at?: string | null;
  duration_ms?: number;
  total_tokens?: number;
  telegram_message_id?: number | null;
}
