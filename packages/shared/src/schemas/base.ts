import z from "zod";

// ===========================================
// BASIC TYPES
// ===========================================

export type UUID = string;
export const UUIDSchema = z.string().uuid();

export const ritualCategorySchema = z.enum([
  "wellness",
  "fitness",
  "productivity",
  "learning",
  "spiritual",
  "social",
  "other",
]);

export const ritualFrequencyTypeSchema = z.enum([
  "once",
  "daily",
  "weekly",
  "custom",
]);

export const stepTypeSchema = z.enum([
  "boolean",
  "counter",
  "qna",
  "timer",
  "scale",
  "workout",
]);

export const exerciseBodyPartSchema = z.enum([
  "core",
  "arms",
  "back",
  "legs",
  "olympic",
  "full_body",
  "cardio",
  "other",
]);

export const exerciseMeasurementTypeSchema = z.enum([
  "weight_reps",
  "reps",
  "time",
  "distance_time",
]);

export const exerciseEquipmentSchema = z.enum([
  "body_weight",
  "dumbbell",
  "barbell",
  "kettlebell",
  "band",
  "plate",
  "pull_up_bar",
  "bench",
  "machine",
  "other",
]);

export const workoutSetSchema = z.object({
  set_number: z.number().int().min(1, "Set number must be at least 1"),
  target_weight_kg: z
    .number()
    .positive("Target weight must be positive")
    .optional(),
  target_reps: z
    .number()
    .int()
    .min(1, "Target reps must be at least 1")
    .optional(),
  target_seconds: z
    .number()
    .positive("Target seconds must be positive")
    .optional(),
  target_distance_m: z
    .number()
    .positive("Target distance must be positive")
    .optional(),
});

export const workoutExerciseSchema = z
  .object({
    // NOTE: validate through db that exercise_id has corresponding exercise_measurement_type
    exercise_id: z.string(),
    exercise_measurement_type: exerciseMeasurementTypeSchema,
    order_index: z.number(),
    workout_sets: z
      .array(workoutSetSchema)
      .min(1, "Workout exercise requires at least one workout set"),
  })
  .refine(
    (data) => {
      return data.workout_sets.every((set) => {
        switch (data.exercise_measurement_type) {
          case "weight_reps":
            return (
              !set.target_distance_m &&
              !set.target_seconds &&
              set.target_weight_kg !== undefined &&
              set.target_reps !== undefined
            );
          case "reps":
            return (
              !set.target_distance_m &&
              !set.target_weight_kg &&
              !set.target_seconds &&
              set.target_reps !== undefined
            );
          case "time":
            return (
              !set.target_distance_m &&
              !set.target_weight_kg &&
              !set.target_reps &&
              set.target_seconds !== undefined
            );
          case "distance_time":
            return (
              !set.target_weight_kg &&
              !set.target_reps &&
              set.target_seconds !== undefined &&
              set.target_distance_m !== undefined
            );
          default:
            return true;
        }
      });
    },
    { message: "Invalid exercise measurement type and workout set combination" }
  );

export const stepDefinitionSchema = z
  .object({
    order_index: z.number(),
    type: stepTypeSchema,
    name: z.string().min(1, "Name is required"),
    is_required: z.boolean(),
    target_count_unit: UUIDSchema.optional(), // uuid reference to physical_quantity.id
    target_count_value: z.number().optional(),
    target_seconds: z.number().optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    workout_exercises: z
      .array(workoutExerciseSchema)
      .min(1, "Workout type requires at least one workout exercise")
      .optional(),
  })
  .refine(
    (data) => {
      switch (data.type) {
        case "qna":
          return (
            !data.workout_exercises &&
            !data.target_count_unit &&
            !data.target_count_value &&
            !data.target_seconds &&
            !data.min_value &&
            !data.max_value
          );
        case "boolean":
          return (
            !data.workout_exercises &&
            !data.target_count_unit &&
            !data.target_count_value &&
            !data.target_seconds &&
            !data.min_value &&
            !data.max_value
          );
        case "workout":
          return (
            !data.target_count_unit &&
            !data.target_count_value &&
            !data.target_seconds &&
            !data.min_value &&
            !data.max_value &&
            data.workout_exercises !== undefined
          );
        // Validate that target_count is a valid UUID reference to physical_quantity_values.id
        case "counter":
          return (
            !data.workout_exercises &&
            !data.target_seconds &&
            !data.min_value &&
            !data.max_value &&
            data.target_count_unit !== undefined &&
            data.target_count_value !== undefined
          );
        case "timer":
          return (
            !data.workout_exercises &&
            !data.target_count_unit &&
            !data.target_count_value &&
            !data.min_value &&
            !data.max_value &&
            data.target_seconds !== undefined
          );
        case "scale":
          return (
            !data.workout_exercises &&
            !data.target_count_unit &&
            !data.target_count_value &&
            !data.target_seconds &&
            data.min_value !== undefined &&
            data.max_value !== undefined
          );
      }
    },
    { message: "Invalid step definition" }
  );

export const workoutSetResponseSchema = z
  .object({
    workout_set_id: UUIDSchema,
    actual_weight_kg: z.number().positive().optional(),
    actual_reps: z.number().positive().optional(),
    actual_seconds: z.number().positive().optional(),
    actual_distance_m: z.number().positive().optional(),
    exercise_measurement_type: exerciseMeasurementTypeSchema,
  })
  .refine(
    (data) => {
      switch (data.exercise_measurement_type) {
        case "weight_reps":
          return (
            !data.actual_distance_m &&
            !data.actual_seconds &&
            data.actual_weight_kg !== undefined &&
            data.actual_reps !== undefined
          );
        case "reps":
          return (
            !data.actual_distance_m &&
            !data.actual_weight_kg &&
            !data.actual_seconds &&
            data.actual_reps !== undefined
          );
        case "time":
          return (
            !data.actual_distance_m &&
            !data.actual_weight_kg &&
            !data.actual_reps &&
            data.actual_seconds !== undefined
          );
        case "distance_time":
          return (
            !data.actual_weight_kg &&
            !data.actual_reps &&
            data.actual_seconds !== undefined &&
            data.actual_distance_m !== undefined
          );
        default:
          return false;
      }
    },
    { message: "Invalid workout set response" }
  );
export const stepResponseSchema = z
  .object({
    // validate step_definition_id
    step_definition_id: UUIDSchema,
    type: stepTypeSchema,
    actual_count: z.number().optional(),
    value_boolean: z.boolean().optional(),
    actual_seconds: z.number().positive().optional(),
    scale_response: z.number().optional(),
    answer: z.string().optional(),
    // validate exercise measurement types
    workout_set_responses: z.array(workoutSetResponseSchema).optional(),
  })
  .refine(
    (data) => {
      switch (data.type) {
        case "qna":
          return (
            !data.actual_count &&
            !data.value_boolean &&
            !data.actual_seconds &&
            !data.scale_response &&
            !data.workout_set_responses &&
            data.answer !== undefined
          );
        case "boolean":
          return (
            !data.actual_count &&
            !data.actual_seconds &&
            !data.scale_response &&
            !data.answer &&
            !data.workout_set_responses &&
            data.value_boolean !== undefined
          );
        case "workout":
          return (
            !data.actual_count &&
            !data.value_boolean &&
            !data.actual_seconds &&
            !data.scale_response &&
            !data.answer &&
            data.workout_set_responses !== undefined
          );
        case "counter":
          return (
            !data.value_boolean &&
            !data.actual_seconds &&
            !data.scale_response &&
            !data.answer &&
            !data.workout_set_responses &&
            data.actual_count !== undefined
          );
        case "timer":
          return (
            !data.actual_count &&
            !data.value_boolean &&
            !data.scale_response &&
            !data.answer &&
            !data.workout_set_responses &&
            data.actual_seconds !== undefined
          );
        case "scale":
          return (
            !data.actual_count &&
            !data.value_boolean &&
            !data.actual_seconds &&
            !data.answer &&
            !data.workout_set_responses &&
            data.scale_response !== undefined
          );
      }
    },
    { message: "Invalid step response" }
  );
