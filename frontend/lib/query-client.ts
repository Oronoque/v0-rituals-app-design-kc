import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus for real-time feel
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: "always",
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query Keys - centralized for consistency
export const queryKeys = {
  // Auth
  auth: {
    user: ["auth", "user"] as const,
    stats: ["auth", "stats"] as const,
  },
  // Rituals
  rituals: {
    all: ["rituals"] as const,
    user: (params?: object) => ["rituals", "user", params] as const,
    public: (params?: object) => ["rituals", "public", params] as const,
    byId: (id: string) => ["rituals", "byId", id] as const,
    stats: (id: string) => ["rituals", "stats", id] as const,
  },
  // Daily schedule and rituals
  daily: {
    all: ["daily"] as const,
    byDate: (date: string) => ["daily", "byDate", date] as const,
    schedule: (date: string) => ["daily", "schedule", date] as const,
  },
  // Exercises
  exercises: {
    all: ["exercises"] as const,
    list: (params?: object) => ["exercises", "list", params] as const,
    byId: (id: string) => ["exercises", "byId", id] as const,
  },
  // Physical Quantities
  physicalQuantities: {
    all: ["physicalQuantities"] as const,
    list: (params?: object) => ["physicalQuantities", "list", params] as const,
    byId: (id: string) => ["physicalQuantities", "byId", id] as const,
  },
} as const;
