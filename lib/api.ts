import { ApiError } from "@/backend/src/middleware/error-handler";
import {
  ApiSuccess,
  AuthResponse,
  UserProfileResponse,
} from "@/backend/src/types/api";
import {
  RitualCompletionWithSteps,
  RitualWithConfig,
  UserDailySchedule,
} from "@/backend/src/types/database";
import { LoginRequest, RegisterRequest } from "@/backend/src/utils/validation";
import {
  BatchCompleteRituals,
  CompleteRitual,
  CreateRitual,
  QuickStepResponse,
  QuickUpdateResponse,
  UpdateRitual,
  UpdateRitualCompletion,
} from "@/backend/src/utils/validation-extended";

// API Client for Rituals Backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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
  ): Promise<ApiSuccess<T>> {
    try {
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

      const apiResponse = (await response.json()) as ApiSuccess<T> | ApiError;
      if (apiResponse.success === false) {
        throw ApiError.parse(apiResponse);
      }

      return apiResponse;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  // Auth Methods
  async login(credentials: LoginRequest): Promise<ApiSuccess<AuthResponse>> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.token = response.data.token;
    if (typeof window !== "undefined") {
      localStorage.setItem("rituals_token", response.data.token);
    }

    return response;
  }

  async register(
    credentials: RegisterRequest
  ): Promise<ApiSuccess<AuthResponse>> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.token = response.data.token;
    if (typeof window !== "undefined") {
      localStorage.setItem("rituals_token", response.data.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiSuccess<UserProfileResponse>> {
    return this.request<UserProfileResponse>("/auth/profile");
  }

  async getUserStats(): Promise<
    ApiSuccess<{
      total_rituals: number;
      public_rituals: number;
      total_forks: number;
      current_streak: number;
    }>
  > {
    return this.request("/auth/stats");
  }

  logout(): void {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("rituals_token");
    }
  }

  // Daily Schedule Methods
  async getDailySchedule(date: string): Promise<ApiSuccess<UserDailySchedule>> {
    const params = new URLSearchParams({ date });
    return this.request<UserDailySchedule>(`/daily-rituals/schedule?${params}`);
  }

  // Ritual Methods
  async createRitual(
    ritual: CreateRitual
  ): Promise<ApiSuccess<RitualWithConfig>> {
    return this.request<RitualWithConfig>("/rituals", {
      method: "POST",
      body: JSON.stringify(ritual),
    });
  }

  async getUserRituals(options?: {
    filter?: "all" | "public" | "private";
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiSuccess<{ rituals: RitualWithConfig[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.filter) params.append("filter", options.filter);
    if (options?.category) params.append("category", options.category);
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/rituals?${queryString}` : "/rituals";

    return this.request<{ rituals: RitualWithConfig[]; total: number }>(
      endpoint
    );
  }

  async getPublicRituals(options?: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiSuccess<{ rituals: RitualWithConfig[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.search) params.append("search", options.search);
    if (options?.category) params.append("category", options.category);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/rituals/public?${queryString}`
      : "/rituals/public";

    return this.request<{ rituals: RitualWithConfig[]; total: number }>(
      endpoint
    );
  }

  async getRitualById(id: string): Promise<ApiSuccess<RitualWithConfig>> {
    return this.request<RitualWithConfig>(`/rituals/${id}`);
  }

  async getRitualStats(id: string): Promise<
    ApiSuccess<{
      total_completions: number;
      avg_duration: number;
      recent_completions: any[];
    }>
  > {
    return this.request(`/rituals/${id}/stats`);
  }

  async updateRitual(
    id: string,
    updates: UpdateRitual
  ): Promise<ApiSuccess<RitualWithConfig>> {
    return this.request<RitualWithConfig>(`/rituals/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteRitual(id: string): Promise<void> {
    await this.request(`/rituals/${id}`, {
      method: "DELETE",
    });
  }

  async completeRitual(
    id: string,
    completion: Omit<CompleteRitual, "ritual_id">
  ): Promise<ApiSuccess<RitualCompletionWithSteps>> {
    return this.request<RitualCompletionWithSteps>(`/rituals/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(completion),
    });
  }

  async updateRitualCompletion(
    id: string,
    updates: UpdateRitualCompletion
  ): Promise<ApiSuccess<RitualCompletionWithSteps>> {
    return this.request<RitualCompletionWithSteps>(`/rituals/${id}/complete`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async forkRitual(id: string): Promise<ApiSuccess<RitualWithConfig>> {
    return this.request<RitualWithConfig>(`/rituals/${id}/fork`, {
      method: "POST",
    });
  }

  async publishRitual(id: string): Promise<ApiSuccess<RitualWithConfig>> {
    return this.request<RitualWithConfig>(`/rituals/${id}/publish`, {
      method: "POST",
    });
  }

  async unpublishRitual(id: string): Promise<ApiSuccess<RitualWithConfig>> {
    return this.request<RitualWithConfig>(`/rituals/${id}/unpublish`, {
      method: "POST",
    });
  }

  // Quick Step Operations
  async createQuickStepResponse(
    id: string,
    stepData: QuickStepResponse
  ): Promise<ApiSuccess<any>> {
    return this.request(`/rituals/${id}/quick-step`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateQuickStepResponse(
    id: string,
    updateData: QuickUpdateResponse
  ): Promise<ApiSuccess<any>> {
    return this.request(`/rituals/${id}/quick-update`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  // Batch Operations
  async batchCompleteRituals(
    batchData: BatchCompleteRituals
  ): Promise<ApiSuccess<{ completions: any[]; total_completed: number }>> {
    return this.request(`/rituals/batch-complete`, {
      method: "POST",
      body: JSON.stringify(batchData),
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

  // Daily Schedule
  getDailySchedule: (date: string) => apiClient.getDailySchedule(date),

  // Rituals
  createRitual: (ritual: CreateRitual) => apiClient.createRitual(ritual),
  getUserRituals: (options?: Parameters<typeof apiClient.getUserRituals>[0]) =>
    apiClient.getUserRituals(options),
  getPublicRituals: (
    options?: Parameters<typeof apiClient.getPublicRituals>[0]
  ) => apiClient.getPublicRituals(options),
  getRitualById: (id: string) => apiClient.getRitualById(id),
  getRitualStats: (id: string) => apiClient.getRitualStats(id),
  updateRitual: (id: string, updates: UpdateRitual) =>
    apiClient.updateRitual(id, updates),
  deleteRitual: (id: string) => apiClient.deleteRitual(id),
  completeRitual: (id: string, completion: Omit<CompleteRitual, "ritual_id">) =>
    apiClient.completeRitual(id, completion),
  updateRitualCompletion: (id: string, updates: UpdateRitualCompletion) =>
    apiClient.updateRitualCompletion(id, updates),
  forkRitual: (id: string) => apiClient.forkRitual(id),
  publishRitual: (id: string) => apiClient.publishRitual(id),
  unpublishRitual: (id: string) => apiClient.unpublishRitual(id),

  // Quick Step Operations
  createQuickStepResponse: (id: string, stepData: QuickStepResponse) =>
    apiClient.createQuickStepResponse(id, stepData),
  updateQuickStepResponse: (id: string, updateData: QuickUpdateResponse) =>
    apiClient.updateQuickStepResponse(id, updateData),

  // Batch Operations
  batchCompleteRituals: (batchData: BatchCompleteRituals) =>
    apiClient.batchCompleteRituals(batchData),
};
