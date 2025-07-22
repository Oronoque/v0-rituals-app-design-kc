"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import type {
  User,
  Ritual,
  CreateRitualRequest,
  LoginRequest,
  RegisterRequest,
} from "@/lib/api";

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

// Ritual Hooks
export function useUserRituals(params?: {
  category?: string;
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
  sort_by?: "name" | "fork_count" | "completion_count" | "created_at";
  sort_order?: "asc" | "desc";
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

export function useCreateRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ritual: CreateRitualRequest) => api.createRitual(ritual),
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
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateRitualRequest>;
    }) => api.updateRitual(id, updates),
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
          rituals: old.rituals.filter((ritual: Ritual) => ritual.id !== id),
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

export function useForkRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.forkRitual(id),
    onSuccess: (forkedRitual) => {
      // Invalidate user rituals to show the new fork
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

      // Update fork count in public rituals cache
      queryClient.setQueryData(queryKeys.rituals.public(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          rituals: old.rituals.map((ritual: Ritual) =>
            ritual.id === forkedRitual.forked_from_id
              ? { ...ritual, fork_count: ritual.fork_count + 1 }
              : ritual
          ),
        };
      });

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
            (ritual: Ritual) => ritual.id !== unpublishedRitual.id
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
