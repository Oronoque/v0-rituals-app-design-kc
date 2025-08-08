// Frontend-friendly schemas with database transform functions

import { v4 } from "uuid";
import { z } from "zod";
import {
  AnyStepType,
  NewRitual,
  NewRitualCompletion,
  NewRitualFrequency,
  NewStepDefinition,
  NewStepResponse,
  RitualCompletionUpdate,
  RitualFrequencyUpdate,
  RitualUpdate,
  StepConfigOf,
  StepResponseOf,
  StepResponseUpdate,
  StepType,
  UserUpdate,
} from "../database-types";
import {
  UUID,
  ritualCategorySchema,
  ritualFrequencyTypeSchema,
  stepDefinitionSchema,
  stepResponseSchema,
} from "../schemas";
import { toNull, transform } from "./util";

export const createRitualSchema = z.object({
  ritual: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable().transform(toNull),
    category: ritualCategorySchema,
    location: z.string().optional().nullable().transform(toNull),
    gear: z.array(z.string()).optional().nullable().transform(toNull),
    is_public: z.boolean().default(false),
    is_active: z.boolean().default(true),
  }),
  frequency: z.object({
    frequency_type: ritualFrequencyTypeSchema,
    frequency_interval: z
      .number()
      .positive("Frequency interval must be positive"),
    days_of_week: z
      .array(z.number().min(0).max(6))
      .optional()
      .nullable()
      .transform(toNull),
    specific_dates: z
      .array(
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      )
      .optional()
      .nullable()
      .transform(toNull),
  }),
  step_definitions: z.array(stepDefinitionSchema),
});

export type CreateRitual = z.infer<typeof createRitualSchema>;

export function transformCreateRitual(data: CreateRitual, user_id: UUID) {
  const ritual_id = v4();
  const ritual: NewRitual = {
    ...data.ritual,
    user_id: user_id,
    id: ritual_id,
    forked_from_id: null,
    completion_count: 0,
    fork_count: 0,
  };
  const frequency: NewRitualFrequency = {
    ...data.frequency,
    ritual_id: ritual_id,
  };
  const step_definitions: NewStepDefinition<StepType>[] =
    data.step_definitions.map(function addStepDefinition(step) {
      const config: StepConfigOf<StepType> = step.config;
      return {
        ...step,
        ritual_id: ritual_id,
        config: JSON.stringify(config),
      };
    });
  return {
    ritual,
    frequency,
    step_definitions,
  };
}

// ===========================================
// COMPLETE RITUAL SCHEMA & TRANSFORM
// ===========================================

export const completeRitualSchema = z.object({
  ritual_id: z.string().uuid("Invalid ritual ID"),
  completed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  duration_seconds: z.number().positive().nullish().transform(toNull),
  notes: z.string().nullish().transform(toNull),
  step_responses: z.array(
    z.object({
      step_definition_id: z.string().uuid("Invalid step definition ID"),
      value: stepResponseSchema,
      response_time_ms: z.number().positive().nullish().transform(toNull),
    })
  ),
});

export type CompleteRitual = z.infer<typeof completeRitualSchema>;

export const transformCompleteRitual = (
  data: CompleteRitual,
  user_id: UUID
) => {
  const completion_id = v4();

  const ritual_completion: NewRitualCompletion = {
    id: completion_id,
    user_id: user_id,
    ritual_id: data.ritual_id,
    completed_date: data.completed_date,
    duration_seconds: data.duration_seconds,
    notes: data.notes,
  };

  const step_responses: NewStepResponse<AnyStepType>[] =
    data.step_responses.map(function addStepResponse(response) {
      const step_response: StepResponseOf<AnyStepType> = response.value;
      return {
        ritual_completion_id: completion_id,
        step_definition_id: response.step_definition_id,
        value: JSON.stringify(step_response),
        response_time_ms: response.response_time_ms,
      };
    });

  return {
    ritual_completion,
    step_responses,
  };
};

// ===========================================
// UPDATE RITUAL SCHEMA & TRANSFORM
// ===========================================

export const updateRitualCompletionSchema = z.object({
  ritual_id: z.string().uuid("Invalid ritual ID"),
  id: z.string().uuid("Invalid ritual completion ID"),
  completed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  duration_seconds: z.number().positive().nullish().transform(toNull),
  notes: z.string().nullish().transform(toNull),
  step_responses: z.array(
    z.object({
      id: z.string().uuid("Invalid step response ID"),
      step_definition_id: z.string().uuid("Invalid step definition ID"),
      value: stepResponseSchema,
      response_time_ms: z.number().positive().nullish().transform(toNull),
    })
  ),
});

export type UpdateRitualCompletion = z.infer<
  typeof updateRitualCompletionSchema
>;

export const transformUpdateRitualCompletion = (
  data: UpdateRitualCompletion
) => {
  const ritual_completion: RitualCompletionUpdate = {
    completed_date: data.completed_date,
    duration_seconds: data.duration_seconds,
    notes: data.notes,
  } as RitualCompletionUpdate;

  const step_responses: StepResponseUpdate<AnyStepType>[] =
    data.step_responses.map(function addStepResponse(response) {
      const step_response: StepResponseOf<AnyStepType> = response.value;
      return {
        id: response.id,
        value: JSON.stringify(step_response),
        response_time_ms: response.response_time_ms,
      };
    });
  return {
    ritual_completion,
    step_responses,
  };
};
// ===========================================
// UPDATE RITUAL SCHEMA & TRANSFORM
// ===========================================

export const updateRitualSchema = z.object({
  ritual: z
    .object({
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional().nullable().transform(transform),
      category: ritualCategorySchema.optional(),
      location: z.string().optional().nullable().transform(transform),
      gear: z.array(z.string()).optional().nullable().transform(transform),
      is_public: z.boolean().optional(),
      is_active: z.boolean().optional(),
    })
    .optional(),
  frequency: z
    .object({
      frequency_type: ritualFrequencyTypeSchema.optional(),
      frequency_interval: z
        .number()
        .positive("Frequency interval must be positive")
        .optional(),
      days_of_week: z
        .array(z.number().min(0).max(6))
        .optional()
        .nullable()
        .transform(transform),
      specific_dates: z
        .array(
          z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        )
        .optional()
        .nullable()
        .transform(transform),
    })
    .optional(),
});

export type UpdateRitual = z.infer<typeof updateRitualSchema>;

export const transformUpdateRitual = (data: UpdateRitual) => {
  const ritual_updates: RitualUpdate = {
    category: data.ritual?.category,
    location: data.ritual?.location,
    gear: data.ritual?.gear,
    is_public: data.ritual?.is_public,
    is_active: data.ritual?.is_active,
    description: data.ritual?.description,
    name: data.ritual?.name,
    updated_at: new Date().toISOString(),
  } as RitualUpdate;
  const frequency_updates: RitualFrequencyUpdate = {
    frequency_type: data.frequency?.frequency_type,
    frequency_interval: data.frequency?.frequency_interval,
    days_of_week: data.frequency?.days_of_week,
    specific_dates: data.frequency?.specific_dates,
    updated_at: new Date().toISOString(),
  } as RitualFrequencyUpdate;
  return {
    ritual_updates,
    frequency_updates,
  };
};

// ===========================================
// UPDATE USER PROFILE SCHEMA & TRANSFORM
// ===========================================

export const updateUserProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name cannot be empty")
    .max(100, "First name must be 100 characters or less")
    .optional(),
  last_name: z
    .string()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name must be 100 characters or less")
    .optional(),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export function transformUpdateUserProfile(
  data: UpdateUserProfile
): UserUpdate {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    updated_at: new Date().toISOString(),
  } as UserUpdate;
}

// ===========================================
// QUICK STEP RESPONSE SCHEMA & TRANSFORM
// ===========================================

// For individual step completions (e.g., updating a single step response)
export const quickStepResponseSchema = z.object({
  step_definition_id: z.string().uuid("Invalid step definition ID"),
  ritual_completion_id: z.string().uuid("Invalid ritual completion ID"),
  value: stepResponseSchema,
  response_time_ms: z.number().positive().nullish().transform(toNull),
});

export type QuickStepResponse = z.infer<typeof quickStepResponseSchema>;

export function transformQuickStepResponse(data: QuickStepResponse) {
  const step_val: StepResponseOf<AnyStepType> = data.value;
  const step_response: NewStepResponse<AnyStepType> = {
    id: v4(),
    ritual_completion_id: data.ritual_completion_id,
    step_definition_id: data.step_definition_id,
    value: JSON.stringify(step_val),
    response_time_ms: data.response_time_ms,
  };

  return {
    step_response,
  };
}

// For quick update of a step response
export const quickUpdateResponseSchema = z.object({
  id: z.string().uuid("Invalid step response ID"),
  value: stepResponseSchema.optional(),
  response_time_ms: z
    .number()
    .positive()
    .nullish()
    .transform(toNull)
    .optional(),
});

export type QuickUpdateResponse = z.infer<typeof quickUpdateResponseSchema>;

export function transformQuickUpdateResponse(data: QuickUpdateResponse) {
  const step_update: StepResponseUpdate<AnyStepType> = {
    value: data.value ? JSON.stringify(data.value) : undefined,
    response_time_ms: data.response_time_ms,
  } as StepResponseUpdate<AnyStepType>;

  return {
    step_update,
  };
}

// ===========================================
// GET USER SCHEDULE SCHEMA (Query params)
// ===========================================

export const getUserScheduleSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  include_completed: z
    .string()
    .optional()
    .default("true")
    .transform(function transformIncludeCompleted(val) {
      return val === "true";
    })
    .pipe(z.boolean()),
  timezone: z.string().optional(),
});

export type GetUserSchedule = z.infer<typeof getUserScheduleSchema>;

// No transform needed for this one as it's just query params

// ===========================================
// BATCH OPERATIONS
// ===========================================

export const batchCompleteRitualsSchema = z.object({
  completions: z
    .array(completeRitualSchema)
    .min(1, "At least one completion required"),
});

export type BatchCompleteRituals = z.infer<typeof batchCompleteRitualsSchema>;

export const transformBatchCompleteRituals = (
  data: BatchCompleteRituals,
  user_id: UUID
) => {
  const all_completions: NewRitualCompletion[] = [];
  const all_step_responses: NewStepResponse<AnyStepType>[] = [];

  data.completions.forEach(function addCompletion(completion) {
    const transformed = transformCompleteRitual(completion, user_id);
    all_completions.push(transformed.ritual_completion);
    all_step_responses.push(...transformed.step_responses);
  });

  return {
    ritual_completions: all_completions,
    step_responses: all_step_responses,
  };
};
