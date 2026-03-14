import { AuthResponse, Channel, Stats, ChannelAnalytics, CronJob, PostLog, Post, DailyMetric, RunError } from "../types";

const API_BASE_URL = "http://localhost:8000/api";

class ApiService {
  private getToken() {
    return localStorage.getItem("token");
  }

  async refreshAccessToken(): Promise<string | null> {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const data = await res.json();
      if (res.ok && data.access) {
        localStorage.setItem("token", data.access);
        return data.access;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, skipAuth = false): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (!skipAuth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    // If token expired, try refresh once then retry
    if (response.status === 401 && data && data.code === 'token_not_valid') {
      const newAccess = await this.refreshAccessToken();
      if (newAccess) {
        // set header and retry
        headers.set("Authorization", `Bearer ${newAccess}`);
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        try { data = await response.json(); } catch (e) { data = null; }
      }
    }

    if (!response.ok) {
      const message = data?.error || data?.message || response.statusText || "API request failed";
      throw new Error(message);
    }

    return data;
  }

  // Auth
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    }, true);
  }

  async register(credentials: { email: string; password: string; username?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(credentials),
    }, true);
  }

  // Channels
  async getChannels(): Promise<Channel[]> {
    return this.request<Channel[]>("/channels/");
  }

  async createChannel(payload: any): Promise<Channel> {
    return this.request<Channel>("/channels/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateChannel(id: number, payload: Partial<Channel>): Promise<Channel> {
    return this.request<Channel>(`/channels/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteChannel(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/channels/${id}/`, {
      method: "DELETE",
    });
  }

  async verifyAdmin(channelUsername: string): Promise<{
    verified: boolean;
    channelName?: string;
    message?: string;
    channel?: { id: number; channelUsername: string; name: string; telegramChatId?: number | null; telegramType?: string };
  }> {
    return this.request(`/channels/verify_admin/`, {
      method: "POST",
      body: JSON.stringify({ channelUsername }),
    });
  }

  // Cron Jobs (nested under channels)
  async getCronJobs(channelId: number): Promise<CronJob[]> {
    return this.request<CronJob[]>(`/channels/${channelId}/cron_jobs/`);
  }

  async createCronJob(
    channelId: number,
    payload: { schedule: string; topic: string; with_images?: boolean; status?: string; nextRun?: string }
  ): Promise<CronJob> {
    return this.request<CronJob>(`/channels/${channelId}/cron_jobs/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateCronJob(channelId: number, id: number, payload: Partial<CronJob>): Promise<CronJob> {
    return this.request<CronJob>(`/channels/${channelId}/cron_jobs/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteCronJob(channelId: number, id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/channels/${channelId}/cron_jobs/${id}/`, {
      method: "DELETE",
    });
  }

  async runCronJobNow(channelId: number, id: number): Promise<{ ok: boolean; detail: string }> {
    return this.request<{ ok: boolean; detail: string }>(`/channels/${channelId}/cron_jobs/${id}/run_now/`, {
      method: "POST",
    });
  }

  async getPostLogs(channelId: number): Promise<PostLog[]> {
    return this.request<PostLog[]>(`/channels/${channelId}/post_logs/`);
  }

  async getPosts(channelId: number): Promise<Post[]> {
    return this.request<Post[]>(`/channels/${channelId}/posts/`);
  }

  // Analytics
  async getAnalyticsTimeseries(days = 30): Promise<DailyMetric[]> {
    return this.request<DailyMetric[]>(`/channels/analytics/timeseries/?days=${days}`);
  }

  async getChannelTimeseries(channelId: number, days = 30): Promise<DailyMetric[]> {
    return this.request<DailyMetric[]>(`/channels/analytics/channels/${channelId}/timeseries/?days=${days}`);
  }

  async getRecentErrors(): Promise<RunError[]> {
    return this.request<RunError[]>(`/channels/analytics/recent_errors/`);
  }

  async getChannelCategories(channelId: number): Promise<{ category: string; count: number }[]> {
    return this.request<{ category: string; count: number }[]>(`/channels/analytics/channels/${channelId}/categories/`);
  }

  async getOverview(): Promise<Stats> {
    return this.request<Stats>(`/channels/analytics/overview/`);
  }

  async getChannelAnalytics(channelId: number): Promise<ChannelAnalytics> {
    return this.request<ChannelAnalytics>(`/channels/analytics/channels/${channelId}/`);
  }

  // AI Models
  async getAIModels(): Promise<any> {
    return this.request(`/channels/ai-models/`);
  }
}

export const api = new ApiService();
