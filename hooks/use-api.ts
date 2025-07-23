"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { LoginRequest, RegisterRequest } from "@/backend/src/utils/validation";
import {
  CreateRitual,
  CompleteRitual,
  UpdateRitual,
  UpdateRitualCompletion,
  QuickStepResponse,
  QuickUpdateResponse,
  BatchCompleteRituals,
} from "@/backend/src/utils/validation-extended";
import {
  RitualWithConfig,
  UserDailySchedule,
} from "@/backend/src/types/database";

// Auth Hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: api.getCurrentUser,
    enabled: apiClient.isAuthenticated(),
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (
        error.message?.includes("Unauthorized") ||
        error.message?.includes("Invalid token")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.auth.stats,
    queryFn: api.getUserStats,
    enabled: apiClient.isAuthenticated(),
    staleTime: 2 * 60 * 1000, // Stats update less frequently
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => api.login(credentials),
    onSuccess: (data) => {
      // Cache user data immediately
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      toast.success(`Welcome back, ${data.user.email}!`);
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Login failed");
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: RegisterRequest) => api.register(credentials),
    onSuccess: (data) => {
      // Cache user data immediately
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      toast.success(`Welcome to Rituals, ${data.user.email}!`);
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Registration failed");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => {
      api.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/");
    },
  });
}

// Daily Schedule Hooks
export function useDailySchedule(date: string) {
  return useQuery({
    queryKey: queryKeys.daily.schedule(date),
    queryFn: () => api.getDailySchedule(date),
    enabled: !!date && apiClient.isAuthenticated(),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

// Ritual Hooks
export function useUserRituals(params?: {
  filter?: "all" | "public" | "private";
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.rituals.user(params),
    queryFn: () => api.getUserRituals(params),
    enabled: apiClient.isAuthenticated(),
    staleTime: 3 * 60 * 1000, // User's own rituals cache for 3 minutes
  });
}

export function usePublicRituals(params?: {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.rituals.public(params),
    queryFn: () => api.getPublicRituals(params),
    staleTime: 10 * 60 * 1000, // Public rituals cache longer
  });
}

export function useRitualById(id: string) {
  return useQuery({
    queryKey: queryKeys.rituals.byId(id),
    queryFn: () => api.getRitualById(id),
    enabled: !!id,
  });
}

export function useRitualStats(id: string) {
  return useQuery({
    queryKey: queryKeys.rituals.stats(id),
    queryFn: () => api.getRitualStats(id),
    enabled: !!id && apiClient.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // Stats cache for 5 minutes
  });
}

export function useCreateRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ritual: CreateRitual) => api.createRitual(ritual),
    onSuccess: (newRitual) => {
      // Invalidate user rituals to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.rituals.byId(newRitual.id), newRitual);

      toast.success(`"${newRitual.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ritual");
    },
  });
}

export function useUpdateRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateRitual }) =>
      api.updateRitual(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals.byId(id) });

      // Snapshot previous value
      const previousRitual = queryClient.getQueryData(
        queryKeys.rituals.byId(id)
      );

      // Optimistically update
      if (previousRitual) {
        queryClient.setQueryData(queryKeys.rituals.byId(id), {
          ...previousRitual,
          ...updates,
        });
      }

      return { previousRitual, id };
    },
    onError: (error: any, { id }, context) => {
      // Rollback on error
      if (context?.previousRitual) {
        queryClient.setQueryData(
          queryKeys.rituals.byId(id),
          context.previousRitual
        );
      }
      toast.error(error.message || "Failed to update ritual");
    },
    onSuccess: (updatedRitual) => {
      // Update cache with server response
      queryClient.setQueryData(
        queryKeys.rituals.byId(updatedRitual.id),
        updatedRitual
      );
      // Invalidate user rituals list
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });
      toast.success(`"${updatedRitual.name}" updated successfully!`);
    },
  });
}

export function useDeleteRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteRitual(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals.user() });

      // Snapshot previous value
      const previousRituals = queryClient.getQueryData(
        queryKeys.rituals.user()
      );

      // Optimistically remove from cache
      queryClient.setQueryData(queryKeys.rituals.user(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          rituals: old.rituals.filter(
            (ritual: RitualWithConfig) => ritual.id !== id
          ),
          total: old.total - 1,
        };
      });

      return { previousRituals, id };
    },
    onError: (error: any, id, context) => {
      // Rollback on error
      if (context?.previousRituals) {
        queryClient.setQueryData(
          queryKeys.rituals.user(),
          context.previousRituals
        );
      }
      toast.error(error.message || "Failed to delete ritual");
    },
    onSuccess: (_, id) => {
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: queryKeys.rituals.byId(id) });
      toast.success("Ritual deleted successfully");
    },
  });
}

// Ritual Completion Hooks
export function useCompleteRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      completion,
    }: {
      id: string;
      completion: Omit<CompleteRitual, "ritual_id">;
    }) => api.completeRitual(id, completion),
    onSuccess: (completedRitual, { id }) => {
      // Invalidate daily schedule to show completion
      queryClient.invalidateQueries({ queryKey: queryKeys.daily.all });

      // Invalidate ritual stats
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.stats(id) });

      // Update completion count in ritual cache
      queryClient.setQueryData(queryKeys.rituals.byId(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          completion_count: old.completion_count + 1,
        };
      });

      toast.success("Ritual completed successfully! 🎉");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to complete ritual");
    },
  });
}

export function useUpdateRitualCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateRitualCompletion;
    }) => api.updateRitualCompletion(id, updates),
    onSuccess: (updatedCompletion, { id }) => {
      // Invalidate daily schedule to show updated completion
      queryClient.invalidateQueries({ queryKey: queryKeys.daily.all });

      // Invalidate ritual stats
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.stats(id) });

      toast.success("Ritual completion updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update ritual completion");
    },
  });
}

// Ritual Actions Hooks
export function useForkRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.forkRitual(id),
    onSuccess: (forkedRitual, originalId) => {
      // Invalidate user rituals to show the new fork
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

      // Update fork count in public rituals cache
      queryClient.setQueryData(queryKeys.rituals.public(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          rituals: old.rituals.map((ritual: RitualWithConfig) =>
            ritual.id === originalId
              ? { ...ritual, fork_count: ritual.fork_count + 1 }
              : ritual
          ),
        };
      });

      // Update fork count in individual ritual cache
      queryClient.setQueryData(
        queryKeys.rituals.byId(originalId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            fork_count: old.fork_count + 1,
          };
        }
      );

      toast.success(`"${forkedRitual.name}" forked to your library!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to fork ritual");
    },
  });
}

export function usePublishRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.publishRitual(id),
    onSuccess: (publishedRitual) => {
      // Update in user rituals
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

      // Update in individual cache
      queryClient.setQueryData(
        queryKeys.rituals.byId(publishedRitual.id),
        publishedRitual
      );

      // Invalidate public rituals to show the newly published ritual
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.public() });

      toast.success(`"${publishedRitual.name}" published to public library!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to publish ritual");
    },
  });
}

export function useUnpublishRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.unpublishRitual(id),
    onSuccess: (unpublishedRitual) => {
      // Update in user rituals
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

      // Update in individual cache
      queryClient.setQueryData(
        queryKeys.rituals.byId(unpublishedRitual.id),
        unpublishedRitual
      );

      // Remove from public rituals cache
      queryClient.setQueryData(queryKeys.rituals.public(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          rituals: old.rituals.filter(
            (ritual: RitualWithConfig) => ritual.id !== unpublishedRitual.id
          ),
          total: old.total - 1,
        };
      });

      toast.success(
        `"${unpublishedRitual.name}" unpublished from public library`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unpublish ritual");
    },
  });
}

// Quick Step Operations Hooks
export function useCreateQuickStepResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      stepData,
    }: {
      id: string;
      stepData: QuickStepResponse;
    }) => api.createQuickStepResponse(id, stepData),
    onSuccess: (_, { id }) => {
      // Invalidate daily schedule and ritual stats
      queryClient.invalidateQueries({ queryKey: queryKeys.daily.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.stats(id) });

      toast.success("Step response added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add step response");
    },
  });
}

export function useUpdateQuickStepResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updateData,
    }: {
      id: string;
      updateData: QuickUpdateResponse;
    }) => api.updateQuickStepResponse(id, updateData),
    onSuccess: (_, { id }) => {
      // Invalidate daily schedule and ritual stats
      queryClient.invalidateQueries({ queryKey: queryKeys.daily.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.stats(id) });

      toast.success("Step response updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update step response");
    },
  });
}

// Batch Operations Hooks
export function useBatchCompleteRituals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchData: BatchCompleteRituals) =>
      api.batchCompleteRituals(batchData),
    onSuccess: (result, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.daily.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.all });

      // Update completion counts for affected rituals
      variables.completions.forEach((completion: any) => {
        queryClient.setQueryData(
          queryKeys.rituals.byId(completion.ritual_id),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              completion_count: old.completion_count + 1,
            };
          }
        );
      });

      toast.success(
        `🎉 ${result.total_completed} rituals completed successfully!`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to complete rituals");
    },
  });
}

// Combined hook for auth state
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user,
    isAuthenticated: !!user && apiClient.isAuthenticated(),
    loading: isLoading,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
