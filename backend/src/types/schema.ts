// ===========================================
// ENUM SCHEMAS
// ===========================================

import z from "zod";

// ===========================================
// BASIC TYPES
// ===========================================

export type UUID = string;
export const UUIDSchema = z.string().uuid();

export const userRoleSchema = z.enum(["admin", "user"]);

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
  "exercise_set",
]);

export const progressionTypeSchema = z.enum([
  "reps",
  "weight",
  "time",
  "distance",
]);

export const exerciseTypeSchema = z.enum([
  "BODYWEIGHT",
  "STRENGTH",
  "POWERLIFTING",
  "CALISTHENIC",
  "PLYOMETRICS",
  "STRETCHING",
  "STRONGMAN",
  "CARDIO",
  "STABILIZATION",
  "POWER",
  "RESISTANCE",
  "CROSSFIT",
  "WEIGHTLIFTING",
]);

export const primaryMuscleGroupSchema = z.enum([
  "BICEPS",
  "SHOULDERS",
  "CHEST",
  "BACK",
  "GLUTES",
  "TRICEPS",
  "HAMSTRINGS",
  "QUADRICEPS",
  "FOREARMS",
  "CALVES",
  "TRAPS",
  "ABDOMINALS",
  "NECK",
  "LATS",
]);

export const secondaryMuscleGroupSchema = z.enum([
  "ADDUCTORS",
  "ABDUCTORS",
  "OBLIQUES",
  "GROIN",
  "FULL_BODY",
  "ROTATOR_CUFF",
  "HIP_FLEXOR",
  "ACHILLES_TENDON",
  "FINGERS",
]);

export const equipmentSchema = z.enum([
  "DUMBBELL",
  "KETTLEBELLS",
  "BARBELL",
  "SMITH_MACHINE",
  "BODY_ONLY",
  "OTHER",
  "BANDS",
  "EZ_BAR",
  "MACHINE",
  "DESK",
  "PULLUP_BAR",
  "NONE",
  "CABLE",
  "MEDICINE_BALL",
  "SWISS_BALL",
  "FOAM_ROLL",
  "WEIGHT_PLATE",
  "TRX",
  "BOX",
  "ROPES",
  "SPIN_BIKE",
  "STEP",
  "BOSU",
  "TYRE",
  "SANDBAG",
  "POLE",
  "BENCH",
  "WALL",
  "BAR",
  "RACK",
  "CAR",
  "SLED",
  "CHAIN",
  "SKIERG",
  "ROPE",
  "NA",
]);

export const mechanicsSchema = z.enum(["ISOLATION", "COMPOUND"]);

export const workoutSetTypeSchema = z.enum([
  "TIME",
  "WEIGHT",
  "REPS",
  "BODYWEIGHT",
  "DISTANCE",
]);

export const workoutSetUnitSchema = z.enum([
  "kg",
  "lbs",
  "seconds",
  "minutes",
  "meters",
  "kilometers",
  "miles",
]);

export const measurementUnitTypeSchema = z.enum([
  "mass",
  "length",
  "temp",
  "time",
  "distance",
]);

export const massUnitSchema = z.enum(["kg", "lbs"]);
export const lengthUnitSchema = z.enum(["cm", "mm", "m", "in", "ft"]);
export const tempUnitSchema = z.enum(["°C", "°F"]);
export const timeUnitSchema = z.enum(["seconds", "minutes"]);
export const distanceUnitSchema = z.enum(["meters", "kilometers", "miles"]);
export const percentageUnitSchema = z.enum(["%"]);

export const measurementWithUnitSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mass"), unit: massUnitSchema }),
  z.object({ type: z.literal("length"), unit: lengthUnitSchema }),
  z.object({ type: z.literal("temp"), unit: tempUnitSchema }),
  z.object({ type: z.literal("time"), unit: timeUnitSchema }),
  z.object({ type: z.literal("distance"), unit: distanceUnitSchema }),
]);

export const moodScaleTypeSchema = z.enum(["emoji", "numeric", "color"]);
export const moodValueSchema = z.enum([
  "very_sad",
  "sad",
  "neutral",
  "happy",
  "very_happy",
]);

// ===========================================
// STEP CONFIG SCHEMAS
// ===========================================

export const booleanStepConfigSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

export const counterStepConfigSchema = z.object({
  question: z.string().min(1, "Question is required"),
  target_value: z.number().positive().optional(),
  unit: measurementWithUnitSchema,
  min_value: z.number().min(0),
  max_value: z.number().positive().optional(),
});

export const qnaStepConfigSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

export const scaleStepConfigSchema = z
  .object({
    question: z.string().min(1, "Question is required"),
    scale_min: z.number(),
    scale_max: z.number(),
  })
  .refine((data) => data.scale_max > data.scale_min, {
    message: "Scale max must be greater than scale min",
  });

export const timerStepConfigSchema = z.object({
  question: z.string().min(1, "Question is required"),
  duration_seconds: z.number().positive("Duration must be positive"),
});

export const exerciseSetStepConfigSchema = z.object({
  question: z.string().min(1, "Question is required"),
  target_sets: z.number().positive("Target sets must be positive"),
  target_reps: z.number().positive().optional(),
  target_weight: z.number().positive().optional(),
  rest_time_seconds: z.number().min(0),
  progression_type: progressionTypeSchema,
  exercise: z.object({
    name: z.string().min(1, "Exercise name is required"),
    type: z
      .array(exerciseTypeSchema)
      .min(1, "At least one exercise type required"),
    primary_muscles: z
      .array(primaryMuscleGroupSchema)
      .min(1, "At least one primary muscle required"),
    secondary_muscles: z.array(secondaryMuscleGroupSchema),
    equipment: z
      .array(equipmentSchema)
      .min(1, "At least one equipment type required"),
    mechanics: mechanicsSchema,
    difficulty: z.number().min(1).max(5, "Difficulty must be between 1-5"),
    instructions: z
      .array(z.string().min(1))
      .min(1, "At least one instruction required"),
    tips: z.array(z.string()).optional(),
    video_url: z.string().url().optional(),
    image_url: z.string().url().optional(),
  }),
});

export const stepConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("boolean"), config: booleanStepConfigSchema }),
  z.object({ type: z.literal("counter"), config: counterStepConfigSchema }),
  z.object({ type: z.literal("qna"), config: qnaStepConfigSchema }),
  z.object({ type: z.literal("scale"), config: scaleStepConfigSchema }),
  z.object({ type: z.literal("timer"), config: timerStepConfigSchema }),
  z.object({
    type: z.literal("exercise_set"),
    config: exerciseSetStepConfigSchema,
  }),
]);

export const booleanStepResponseSchema = z.object({
  value: z.boolean(),
});

export const counterStepResponseSchema = z.object({
  actual_value: z.number().min(0),
});

export const qnaStepResponseSchema = z.object({
  text_response: z.string().min(1, "Response text is required"),
});

export const scaleStepResponseSchema = z.object({
  scale_value: z.number(),
});

export const timerStepResponseSchema = z.object({
  planned_duration: z.number().positive(),
  actual_duration: z.number().min(0),
  completed_early: z.boolean(),
});

export const exerciseSetStepResponseSchema = z.object({
  sets_completed: z.number().min(0),
  total_reps: z.number().min(0).optional(),
  average_weight: z.number().positive().optional(),
  total_weight: z.number().min(0).optional(),
  total_time: z.number().min(0).optional(),
  total_distance: z.number().min(0).optional(),
  progression: z.string().optional(),
  sets: z.array(
    z.object({
      set_index: z.number().min(0),
      set_type: workoutSetTypeSchema,
      values: z.array(
        z.object({
          type: workoutSetTypeSchema,
          value: z.number().min(0),
          unit: workoutSetUnitSchema,
        })
      ),
      completed: z.boolean(),
      rest_time_seconds: z.number().min(0).optional(),
    })
  ),
});

// Union of all step response schemas
export const stepResponseSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("boolean"), value: booleanStepResponseSchema }),
    z.object({ type: z.literal("counter"), value: counterStepResponseSchema }),
    z.object({ type: z.literal("qna"), value: qnaStepResponseSchema }),
    z.object({ type: z.literal("scale"), value: scaleStepResponseSchema }),
    z.object({ type: z.literal("timer"), value: timerStepResponseSchema }),
    z.object({
      type: z.literal("exercise_set"),
      value: exerciseSetStepResponseSchema,
    }),
  ])
  .transform((data) => data.value);

// ===========================================
// STEP DEFINITION SCHEMAS
// ===========================================

export const stepDefinitionSchema = z.object({
  order_index: z.number().min(0),
  type: stepTypeSchema,
  name: z.string().min(1, "Step name is required"),
  config: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("boolean"), config: booleanStepConfigSchema }),
      z.object({ type: z.literal("counter"), config: counterStepConfigSchema }),
      z.object({ type: z.literal("qna"), config: qnaStepConfigSchema }),
      z.object({ type: z.literal("scale"), config: scaleStepConfigSchema }),
      z.object({ type: z.literal("timer"), config: timerStepConfigSchema }),
      z.object({
        type: z.literal("exercise_set"),
        config: exerciseSetStepConfigSchema,
      }),
    ])
    .transform((data) => data.config),
  is_required: z.boolean(),
});

// ===========================================
// FREQUENCY SCHEMAS
// ===========================================

export const ritualFrequencySchema = z
  .object({
    frequency_type: ritualFrequencyTypeSchema,
    frequency_interval: z
      .number()
      .positive("Frequency interval must be positive"),
    days_of_week: z.array(z.number().min(0).max(6)).optional().nullable(),
    specific_dates: z
      .array(
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      )
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (
        data.frequency_type === "weekly" &&
        (!data.days_of_week || data.days_of_week.length === 0)
      ) {
        return false;
      }
      if (
        data.frequency_type === "custom" &&
        (!data.specific_dates || data.specific_dates.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Weekly frequency requires days_of_week, custom frequency requires specific_dates",
    }
  );
