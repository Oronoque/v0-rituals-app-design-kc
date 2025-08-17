import z from "zod";
import {
  ritualCategorySchema,
  ritualFrequencyTypeSchema,
  stepDefinitionSchema,
  stepResponseSchema,
  UUIDSchema,
} from "./base";

export const createRitualSchema = z.object({
  ritual: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    category: ritualCategorySchema,
    location: z.string().optional(),
    gear: z.array(z.string()).optional(),
    is_public: z.boolean().default(false),
    is_active: z.boolean().default(true),
  }),
  frequency: z
    .object({
      frequency_type: ritualFrequencyTypeSchema,
      frequency_interval: z
        .number()
        .positive("Frequency interval must be positive"),
      days_of_week: z.array(z.number().min(0).max(6)).optional(),
      specific_dates: z
        .array(
          z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        )
        .optional(),
      exclude_dates: z
        .array(
          z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        )
        .optional(),
    })
    .refine(
      (data) => {
        const {
          frequency_type,
          frequency_interval,
          days_of_week,
          specific_dates,
          exclude_dates,
        } = data;
        switch (frequency_type) {
          case "daily":
            return frequency_interval === 1 && !days_of_week && !specific_dates;
          case "once":
            return (
              frequency_interval === 1 &&
              !days_of_week &&
              !specific_dates &&
              !exclude_dates
            );
          case "custom":
            return frequency_interval >= 1 && !days_of_week && specific_dates;
          case "weekly":
            return frequency_interval >= 1 && days_of_week && !specific_dates;
          default:
            return false;
        }
      },
      { message: "Frequency is required to be set correctly" }
    ),
  step_definitions: z
    .array(stepDefinitionSchema)
    .min(1, "At least one step definition is required")
    .refine(
      (steps) => {
        const typeMap: Record<string, string> = {};

        for (const step of steps) {
          for (const exercise of step.workout_exercises ?? []) {
            const prevType = typeMap[exercise.exercise_id];
            if (prevType && prevType !== exercise.exercise_measurement_type) {
              return false; // Conflict found
            }
            typeMap[exercise.exercise_id] = exercise.exercise_measurement_type;
          }
        }

        return true; // No conflicts
      },
      {
        message:
          "Conflicting measurement types found for the same exercise_id.",
      }
    ),
});

export type CreateRitualSchemaType = z.infer<typeof createRitualSchema>;

// validate that the ritual_id is a valid UUID reference to rituals.id and is user's ritual
export const completeRitualSchema = z.object({
  ritual_id: UUIDSchema,
  notes: z.string().optional(),
  // validate that step_responses.step_definition_id(s) -> step_definitions.id have relation for the given ritual_id
  // and that the step_definition.type is same as step_response.type
  step_responses: z.array(stepResponseSchema),
});

export type CompleteRitualSchemaType = z.infer<typeof completeRitualSchema>;

// Daily schedule query schema
export const getDailyScheduleSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  include_completed: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
  timezone: z.string().optional(),
});

export type GetDailyScheduleSchemaType = z.infer<typeof getDailyScheduleSchema>;
