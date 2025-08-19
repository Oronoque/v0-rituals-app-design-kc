"use client";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import {
  CompleteRitualSchemaType,
  CreateRitualSchemaType,
  ExerciseBodyPart,
  ExerciseEquipment,
  ExerciseMeasurementType,
  FullRitual,
} from "@rituals/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Daily Schedule Hooks
export function useDailySchedule(date: string) {
  return useQuery({
    queryKey: queryKeys.daily.schedule(date),
    queryFn: async () => {
      const result = await api.getDailySchedule(date);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch daily schedule");
        return null;
      }
    },
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
    queryFn: async () => {
      const result = await api.getUserRituals(params);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch user rituals");
        return null;
      }
    },
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
    queryFn: async () => {
      const result = await api.getPublicRituals(params);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch public rituals");
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // Public rituals cache longer
  });
}

export function useRitualById(id: string) {
  return useQuery({
    queryKey: queryKeys.rituals.byId(id),
    queryFn: async () => {
      const result = await api.getRitualById(id);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch ritual");
        return null;
      }
    },
    enabled: !!id,
  });
}

export function useRitualStats(id: string) {
  return useQuery({
    queryKey: queryKeys.rituals.stats(id),
    queryFn: async () => {
      const result = await api.getRitualStats(id);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch ritual stats");
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Stats cache for 5 minutes
  });
}

export function useCreateRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ritual: CreateRitualSchemaType) => api.createRitual(ritual),
    onSuccess: (result) => {
      // Invalidate user rituals to refetch
      if (result.isOk()) {
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

        // Add to cache optimistically
        queryClient.setQueryData(
          queryKeys.rituals.byId(result.value.data.id),
          result.value.data
        );

        toast.success(`"${result.value.data.name}" created successfully!`);
      } else {
        toast.error(result.error.message || "Failed to create ritual");
      }
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
      updates: Partial<CreateRitualSchemaType>;
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
    onSuccess: (result) => {
      // Update cache with server response
      if (result.isOk()) {
        queryClient.setQueryData(
          queryKeys.rituals.byId(result.value.data.id),
          result.value.data
        );
        // Invalidate user rituals list
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });
        toast.success(`"${result.value.data.name}" updated successfully!`);
      } else {
        toast.error(result.error.message || "Failed to update ritual");
      }
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
          rituals: old.rituals.filter((ritual: FullRitual) => ritual.id !== id),
          total: old.total - 1,
        };
      });

      return { previousRituals, id };
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
      completion: Omit<CompleteRitualSchemaType, "ritual_id">;
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
      updates: Partial<CompleteRitualSchemaType>;
    }) => api.updateRitualCompletion(id, updates),
    onSuccess: (updatedCompletion, { id }) => {
      // Invalidate daily schedule to show updated completion
      queryClient.invalidateQueries({ queryKey: queryKeys.daily.all });

      // Invalidate ritual stats
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals.stats(id) });

      toast.success("Ritual completion updated successfully!");
    },
  });
}

// Ritual Actions Hooks
export function useForkRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.forkRitual(id),
    onSuccess: (result, originalId) => {
      // Invalidate user rituals to show the new fork
      if (result.isOk()) {
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

        // Update fork count in public rituals cache
        queryClient.setQueryData(queryKeys.rituals.public(), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            rituals: old.rituals.map((ritual: FullRitual) =>
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

        toast.success(`"${result.value.data.name}" forked to your library!`);
      } else {
        toast.error(result.error.message || "Failed to fork ritual");
      }
    },
  });
}

export function usePublishRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.publishRitual(id),
    onSuccess: (result, id) => {
      if (result.isOk()) {
        // Update in user rituals
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

        // Invalidate individual cache to refetch updated ritual
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.byId(id) });

        // Invalidate public rituals to show the newly published ritual
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.public() });

        toast.success("Ritual published to public library!");
      } else {
        toast.error(result.error.message || "Failed to publish ritual");
      }
    },
  });
}

export function useUnpublishRitual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.unpublishRitual(id),
    onSuccess: (result, id) => {
      if (result.isOk()) {
        // Update in user rituals
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.user() });

        // Invalidate individual cache to refetch updated ritual
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.byId(id) });

        // Remove from public rituals cache
        queryClient.setQueryData(queryKeys.rituals.public(), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            rituals: old.rituals.filter(
              (ritual: FullRitual) => ritual.id !== id
            ),
            total: old.total - 1,
          };
        });

        toast.success("Ritual unpublished from public library");
      } else {
        toast.error(result.error.message || "Failed to unpublish ritual");
      }
    },
  });
}

// Exercise Hooks
export function useExercises(params?: {
  body_part?: ExerciseBodyPart;
  equipment?: ExerciseEquipment;
  measurement_type?: ExerciseMeasurementType;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.exercises.list(params),
    queryFn: async () => {
      const result = await api.getExercises(params);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch exercises");
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // Exercises cache for 10 minutes
  });
}

export function useExerciseById(id: string) {
  return useQuery({
    queryKey: queryKeys.exercises.byId(id),
    queryFn: async () => {
      const result = await api.getExerciseById(id);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(result.error.message || "Failed to fetch exercise");
        return null;
      }
    },
    enabled: !!id,
  });
}

// Physical Quantities Hooks
export function usePhysicalQuantities(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.physicalQuantities.list(params),
    queryFn: async () => {
      const result = await api.getPhysicalQuantities(params);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(
          result.error.message || "Failed to fetch physical quantities"
        );
        return null;
      }
    },
    staleTime: 30 * 60 * 1000, // Physical quantities cache for 30 minutes (rarely change)
  });
}

export function usePhysicalQuantityById(id: string) {
  return useQuery({
    queryKey: queryKeys.physicalQuantities.byId(id),
    queryFn: async () => {
      const result = await api.getPhysicalQuantityById(id);
      if (result.isOk()) {
        return result.value.data;
      } else {
        toast.error(
          result.error.message || "Failed to fetch physical quantity"
        );
        return null;
      }
    },
    enabled: !!id,
  });
}
