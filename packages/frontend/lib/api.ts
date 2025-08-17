import {
  ApiErrorResponse,
  ApiResult,
  ApiSuccess,
  CompleteRitualSchemaType,
  CreateRitualSchemaType,
  Exercise,
  ExerciseBodyPart,
  ExerciseEquipment,
  ExerciseMeasurementType,
  FullRitual,
  FullRitualCompletion,
  LoginRequest,
  PhysicalQuantity,
  RegisterRequest,
  UserDailySchedule,
  UserProfileResponse,
} from "@rituals/shared";
import { err, ok } from "neverthrow";

// API Client Class
export class ApiClient {
  private baseUrl: string;
  private static instance: ApiClient | null = null;
  private constructor() {
    // API Client for Rituals Backend
    let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
    if (!baseUrl) {
      throw new Error("API_URL or NEXT_PUBLIC_API_URL is not set");
    }
    baseUrl += "/api";
    this.baseUrl = baseUrl;
    // Stop using localStorage; cookies will carry the token
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      // With cookies, do not set Authorization header
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      const apiResponse = (await response.json()) as
        | ApiSuccess<T>
        | ApiErrorResponse;
      if (apiResponse.status === "success") {
        return ok(apiResponse);
      } else {
        return err(apiResponse);
      }
    } catch (error) {
      console.error(error);
      return err({
        message:
          error instanceof Error
            ? error.message
            : "Unknown error, check console for details",
        name: "InternalError",
        status: "error",
      } as ApiErrorResponse);
    }
  }
  // Auth Methods
  async login(
    credentials: LoginRequest
  ): Promise<ApiResult<UserProfileResponse>> {
    const response = await this.request<UserProfileResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return response;
  }

  async register(
    credentials: RegisterRequest
  ): Promise<ApiResult<UserProfileResponse>> {
    const response = await this.request<UserProfileResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return response;
  }

  async getCurrentUser(): Promise<ApiResult<UserProfileResponse>> {
    return this.request<UserProfileResponse>("/auth/profile");
  }

  async logout(): Promise<ApiResult<void>> {
    return this.request<void>("/auth/logout", {
      method: "POST",
    });
  }

  // Daily Schedule Methods
  async getDailySchedule(date: string): Promise<ApiResult<UserDailySchedule>> {
    const params = new URLSearchParams({ date });
    return this.request<UserDailySchedule>(`/rituals/daily-schedule?${params}`);
  }

  // Ritual Methods
  async createRitual(
    ritual: CreateRitualSchemaType
  ): Promise<ApiResult<FullRitual>> {
    return this.request<FullRitual>("/rituals", {
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
  }): Promise<ApiResult<{ rituals: FullRitual[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.filter) params.append("filter", options.filter);
    if (options?.category) params.append("category", options.category);
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/rituals/user?${queryString}`
      : "/rituals/user";

    return this.request<{ rituals: FullRitual[]; total: number }>(endpoint);
  }

  async getPublicRituals(options?: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<{ rituals: FullRitual[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.search) params.append("search", options.search);
    if (options?.category) params.append("category", options.category);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/rituals/public?${queryString}`
      : "/rituals/public";

    return this.request<{ rituals: FullRitual[]; total: number }>(endpoint);
  }

  async getRitualById(id: string): Promise<ApiResult<FullRitual>> {
    return this.request<FullRitual>(`/rituals/${id}`);
  }

  async getRitualStats(id: string): Promise<
    ApiResult<{
      total_completions: number;
      avg_duration: number;
      recent_completions: any[];
    }>
  > {
    return this.request(`/rituals/${id}/stats`);
  }

  async updateRitual(
    id: string,
    updates: Partial<CreateRitualSchemaType>
  ): Promise<ApiResult<FullRitual>> {
    return this.request<FullRitual>(`/rituals/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteRitual(id: string): Promise<ApiResult<void>> {
    return this.request<void>(`/rituals/${id}`, {
      method: "DELETE",
    });
  }

  async completeRitual(
    id: string,
    completion: Omit<CompleteRitualSchemaType, "ritual_id">
  ): Promise<ApiResult<FullRitualCompletion>> {
    return this.request<FullRitualCompletion>(`/rituals/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(completion),
    });
  }

  async updateRitualCompletion(
    id: string,
    updates: Partial<CompleteRitualSchemaType>
  ): Promise<ApiResult<FullRitualCompletion>> {
    return this.request<FullRitualCompletion>(`/rituals/${id}/complete`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async forkRitual(id: string): Promise<ApiResult<FullRitual>> {
    return this.request<FullRitual>(`/rituals/${id}/fork`, {
      method: "POST",
    });
  }

  async publishRitual(id: string): Promise<ApiResult<void>> {
    return this.request<void>(`/rituals/${id}/publish`, {
      method: "POST",
    });
  }

  async unpublishRitual(id: string): Promise<ApiResult<void>> {
    return this.request<void>(`/rituals/${id}/unpublish`, {
      method: "POST",
    });
  }

  // Exercise Methods
  async getExercises(options?: {
    body_part?: ExerciseBodyPart;
    equipment?: ExerciseEquipment;
    measurement_type?: ExerciseMeasurementType;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<{ exercises: Exercise[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.body_part) params.append("body_part", options.body_part);
    if (options?.equipment) params.append("equipment", options.equipment);
    if (options?.measurement_type)
      params.append("measurement_type", options.measurement_type);
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/exercises?${queryString}` : "/exercises";

    return this.request<{ exercises: Exercise[]; total: number }>(endpoint);
  }

  async getExerciseById(id: string): Promise<ApiResult<Exercise>> {
    return this.request<Exercise>(`/exercises/${id}`);
  }

  // Physical Quantities Methods
  async getPhysicalQuantities(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResult<{ physical_quantities: PhysicalQuantity[]; total: number }>
  > {
    const params = new URLSearchParams();
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/exercises/physical-quantities?${queryString}`
      : "/exercises/physical-quantities";

    return this.request<{
      physical_quantities: PhysicalQuantity[];
      total: number;
    }>(endpoint);
  }

  async getPhysicalQuantityById(
    id: string
  ): Promise<ApiResult<PhysicalQuantity>> {
    return this.request<PhysicalQuantity>(
      `/exercises/physical-quantities/${id}`
    );
  }
}

// Create a singleton instance
export const apiClient = ApiClient.getInstance();

// Helper functions for common operations
export const api = {
  // Auth
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  register: (credentials: RegisterRequest) => apiClient.register(credentials),
  getCurrentUser: () => apiClient.getCurrentUser(),
  logout: () => apiClient.logout(),

  // Daily Schedule
  getDailySchedule: (date: string) => apiClient.getDailySchedule(date),

  // Rituals
  createRitual: (ritual: CreateRitualSchemaType) =>
    apiClient.createRitual(ritual),
  getUserRituals: (options?: Parameters<typeof apiClient.getUserRituals>[0]) =>
    apiClient.getUserRituals(options),
  getPublicRituals: (
    options?: Parameters<typeof apiClient.getPublicRituals>[0]
  ) => apiClient.getPublicRituals(options),
  getRitualById: (id: string) => apiClient.getRitualById(id),
  getRitualStats: (id: string) => apiClient.getRitualStats(id),
  updateRitual: (id: string, updates: Partial<CreateRitualSchemaType>) =>
    apiClient.updateRitual(id, updates),
  deleteRitual: (id: string) => apiClient.deleteRitual(id),
  completeRitual: (
    id: string,
    completion: Omit<CompleteRitualSchemaType, "ritual_id">
  ) => apiClient.completeRitual(id, completion),
  updateRitualCompletion: (
    id: string,
    updates: Partial<CompleteRitualSchemaType>
  ) => apiClient.updateRitualCompletion(id, updates),
  forkRitual: (id: string) => apiClient.forkRitual(id),
  publishRitual: (id: string) => apiClient.publishRitual(id),
  unpublishRitual: (id: string) => apiClient.unpublishRitual(id),

  // Exercises
  getExercises: (options?: Parameters<typeof apiClient.getExercises>[0]) =>
    apiClient.getExercises(options),
  getExerciseById: (id: string) => apiClient.getExerciseById(id),

  // Physical Quantities
  getPhysicalQuantities: (
    options?: Parameters<typeof apiClient.getPhysicalQuantities>[0]
  ) => apiClient.getPhysicalQuantities(options),
  getPhysicalQuantityById: (id: string) =>
    apiClient.getPhysicalQuantityById(id),
};
