// API Client for Rituals Backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Types (matching backend API response format)
export interface User {
  id: string;
  email: string;
  current_streak: number;
  proof_score: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Step {
  id: string;
  type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom";
  name: string;
  question?: string;
  weightlifting_config?: Array<{
    reps: number;
    weight: number;
    completed: boolean | null;
  }>;
  cardio_config?: Array<{
    time: number;
    distance: number;
    completed: boolean | null;
  }>;
  custom_config?: {
    label: string;
    unit: string;
  };
  order_index: number;
}

export interface Ritual {
  id: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  gear?: string[];
  is_public: boolean;
  forked_from_id?: string;
  fork_count: number;
  completion_count: number;
  // Frequency settings
  frequency_type: "once" | "daily" | "weekly" | "custom";
  frequency_interval: number;
  frequency_data?: FrequencyData;
  is_active: boolean;
  steps: Step[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRitualRequest {
  name: string;
  is_public: boolean;
  description?: string;
  category?: string;
  location?: string;
  gear?: string[];
  frequency_type: "once" | "daily" | "weekly" | "custom";
  frequency_interval: number;
  frequency_data?: FrequencyData;
  steps: Array<{
    type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom";
    name: string;
    question?: string;
    weightlifting_config?: Array<{
      reps: number;
      weight: number;
      completed?: boolean | null;
    }>;
    cardio_config?: Array<{
      time: number;
      distance: number;
      completed?: boolean | null;
    }>;
    custom_config?: {
      label: string;
      unit: string;
    };
  }>;
}

export interface CreateDailyRitualRequest {
  ritual_id: string;
  scheduled_date: string;
  scheduled_time?: string;
}

export interface UpdateDailyRitualRequest {
  scheduled_time?: string;
  steps?: Array<{
    step_id: string;
    completed?: boolean;
    skipped?: boolean;
    answer?: StepAnswer;
    was_modified?: boolean;
  }>;
}

// Frequency configuration types
export interface FrequencyData {
  days_of_week?: number[]; // 0-6 for Sunday-Saturday (for weekly custom)
  specific_dates?: string[]; // For specific date scheduling
  [key: string]: any; // Allow for future frequency types
}

// Daily Ritual (for daily instances)
export interface DailyRitual {
  id: string;
  user_id: string;
  ritual: Ritual;
  scheduled_date: string;
  scheduled_time?: string;
  completed: boolean;
  was_modified: boolean;
  completed_at?: string;
  steps: DailyStep[];
}

// Step answer types
export interface WeightliftingAnswer {
  sets: Array<{ reps: number; weight: number; completed?: boolean }>;
}

export interface CardioAnswer {
  rounds: Array<{ time: number; distance: number; completed?: boolean }>;
}

export interface CustomAnswer {
  value: number;
  unit: string;
}

export type StepAnswer =
  | string
  | WeightliftingAnswer
  | CardioAnswer
  | CustomAnswer;

// Daily Step (for daily instances - with completion status)
export interface DailyStep extends Step {
  completed: boolean;
  skipped: boolean;
  answer?: StepAnswer;
  was_modified: boolean;
  completed_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

// API Client Class
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("rituals_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  }

  // Auth Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.token = response.token;
    if (typeof window !== "undefined") {
      localStorage.setItem("rituals_token", response.token);
    }

    return response;
  }

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.token = response.token;
    if (typeof window !== "undefined") {
      localStorage.setItem("rituals_token", response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async getUserStats(): Promise<{
    total_rituals: number;
    public_rituals: number;
    total_forks: number;
    current_streak: number;
    proof_score: string;
  }> {
    return this.request("/auth/stats");
  }

  logout(): void {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("rituals_token");
    }
  }

  // Ritual Methods
  async createRitual(ritual: CreateRitualRequest): Promise<Ritual> {
    return this.request<Ritual>("/rituals", {
      method: "POST",
      body: JSON.stringify(ritual),
    });
  }

  async getUserRituals(options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rituals: Ritual[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/rituals?${queryString}` : "/rituals";

    return this.request<{ rituals: Ritual[]; total: number }>(endpoint);
  }

  async getPublicRituals(options?: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
    sort_by?: "name" | "fork_count" | "completion_count" | "created_at";
    sort_order?: "asc" | "desc";
  }): Promise<{ rituals: Ritual[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.search) params.append("search", options.search);
    if (options?.category) params.append("category", options.category);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    if (options?.sort_by) params.append("sort_by", options.sort_by);
    if (options?.sort_order) params.append("sort_order", options.sort_order);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/rituals/public?${queryString}`
      : "/rituals/public";

    return this.request<{ rituals: Ritual[]; total: number }>(endpoint);
  }

  async getRitualById(id: string): Promise<Ritual> {
    return this.request<Ritual>(`/rituals/${id}`);
  }

  async updateRitual(
    id: string,
    updates: Partial<CreateRitualRequest>
  ): Promise<Ritual> {
    return this.request<Ritual>(`/rituals/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteRitual(id: string): Promise<void> {
    await this.request(`/rituals/${id}`, {
      method: "DELETE",
    });
  }

  async forkRitual(id: string): Promise<Ritual> {
    return this.request<Ritual>(`/rituals/${id}/fork`, {
      method: "POST",
    });
  }

  async publishRitual(id: string): Promise<Ritual> {
    return this.request<Ritual>(`/rituals/${id}/publish`, {
      method: "POST",
    });
  }

  async unpublishRitual(id: string): Promise<Ritual> {
    return this.request<Ritual>(`/rituals/${id}/unpublish`, {
      method: "POST",
    });
  }

  // Helper Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("rituals_token", token);
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export const api = {
  // Auth
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  register: (credentials: RegisterRequest) => apiClient.register(credentials),
  getCurrentUser: () => apiClient.getCurrentUser(),
  getUserStats: () => apiClient.getUserStats(),
  logout: () => apiClient.logout(),
  isAuthenticated: () => apiClient.isAuthenticated(),

  // Rituals
  createRitual: (ritual: CreateRitualRequest) => apiClient.createRitual(ritual),
  getUserRituals: (options?: Parameters<typeof apiClient.getUserRituals>[0]) =>
    apiClient.getUserRituals(options),
  getPublicRituals: (
    options?: Parameters<typeof apiClient.getPublicRituals>[0]
  ) => apiClient.getPublicRituals(options),
  getRitualById: (id: string) => apiClient.getRitualById(id),
  updateRitual: (id: string, updates: Partial<CreateRitualRequest>) =>
    apiClient.updateRitual(id, updates),
  deleteRitual: (id: string) => apiClient.deleteRitual(id),
  forkRitual: (id: string) => apiClient.forkRitual(id),
  publishRitual: (id: string) => apiClient.publishRitual(id),
  unpublishRitual: (id: string) => apiClient.unpublishRitual(id),
};
