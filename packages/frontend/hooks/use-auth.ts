"use client";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { LoginRequest, RegisterRequest } from "@rituals/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { toast } from "sonner";

// Auth Hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async () => {
      const user = await api.getCurrentUser();
      if (user.isOk()) {
        return user.value.data;
      } else {
        return null;
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => api.login(credentials),
    onSuccess: (result) => {
      // Cache user data immediately
      if (result.isOk()) {
        queryClient.setQueryData(queryKeys.auth.user, result.value.data);
        toast.success(`Welcome back, ${result.value.data.email}!`);
      } else {
        toast.error(result.error.message || "Login failed");
      }
      router.push("/");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: (result) => {
      if (result.isOk()) {
        queryClient.clear();
        toast.success("Logged out 😢");
        router.push("/");
      } else {
        toast.error(result.error.message || "Logout failed");
      }
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: RegisterRequest) => api.register(credentials),
    onSuccess: (result) => {
      // Cache user data immediately
      if (result.isOk()) {
        queryClient.setQueryData(queryKeys.auth.user, result.value.data);
        toast.success(`Welcome to Rituals, ${result.value.data.email}!`);
        router.push("/");
      } else {
        toast.error(result.error.message || "Registration failed");
      }
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
    isAuthenticated: !!user,
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
