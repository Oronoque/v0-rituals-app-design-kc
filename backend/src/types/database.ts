import {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely";
import z from "zod";
import * as zodSchema from "./schema";

// ===========================================
// ENUMS
// ===========================================

export type UserRole = z.infer<typeof zodSchema.userRoleSchema>;

export type RitualFrequencyType = z.infer<
  typeof zodSchema.ritualFrequencyTypeSchema
>;
export type RitualCategory = z.infer<typeof zodSchema.ritualCategorySchema>;

export type StepType = z.infer<typeof zodSchema.stepTypeSchema>;

export type ProgressionType = z.infer<typeof zodSchema.progressionTypeSchema>;

export type ExerciseType = z.infer<typeof zodSchema.exerciseTypeSchema>;

export type PrimaryMuscleGroup = z.infer<
  typeof zodSchema.primaryMuscleGroupSchema
>;

export type SecondaryMuscleGroup = z.infer<
  typeof zodSchema.secondaryMuscleGroupSchema
>;

export type Equipment = z.infer<typeof zodSchema.equipmentSchema>;
export type Mechanics = z.infer<typeof zodSchema.mechanicsSchema>;

export type WorkoutSetType = z.infer<typeof zodSchema.workoutSetTypeSchema>;
export type WorkoutSetUnit = z.infer<typeof zodSchema.workoutSetUnitSchema>;

export type MassUnit = z.infer<typeof zodSchema.massUnitSchema>;
export type LengthUnit = z.infer<typeof zodSchema.lengthUnitSchema>;
export type TempUnit = z.infer<typeof zodSchema.tempUnitSchema>;
export type TimeUnit = z.infer<typeof zodSchema.timeUnitSchema>;
export type DistanceUnit = z.infer<typeof zodSchema.distanceUnitSchema>;
export type PercentageUnit = z.infer<typeof zodSchema.percentageUnitSchema>;

export type MeasurementWithUnit = z.infer<
  typeof zodSchema.measurementWithUnitSchema
>;

export type MoodScaleType = z.infer<typeof zodSchema.moodScaleTypeSchema>;
export type MoodValue = z.infer<typeof zodSchema.moodValueSchema>;

// ===========================================
// DATABASE TABLE INTERFACES
// ===========================================

export interface Database {
  users: UsersTable;
  rituals: RitualsTable;
  ritual_frequencies: RitualFrequenciesTable;
  ritual_completions: RitualCompletionsTable;
  step_definitions: StepDefinitionsTable<StepType>;
  step_responses: StepResponsesTable<StepType>;
}

// Users table
export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  current_streak: number;
  timezone: string; // Store UTC offset (e.g., "+05:00", "-08:00", "+00:00")
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

// Rituals table (templates)
export interface RitualsTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  description: string | null;
  category: RitualCategory;
  location: string | null;
  gear: string[] | null;
  is_public: boolean;
  is_active: boolean;
  forked_from_id: string | null;
  fork_count: number;
  completion_count: number;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

// Ritual frequencies table
export interface RitualFrequenciesTable {
  id: Generated<string>;
  ritual_id: string;
  frequency_type: RitualFrequencyType;
  frequency_interval: number;
  days_of_week: number[] | null;
  specific_dates: string[] | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Ritual completions table (actual completed rituals)
export interface RitualCompletionsTable {
  id: Generated<string>;
  user_id: string;
  ritual_id: string;
  completed_date: string; // DATE type
  completed_at: ColumnType<Date, string | undefined, never>;
  duration_seconds: number | null;
  notes: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Step definitions table (templates within rituals)
export interface StepDefinitionsTable<T extends StepType> {
  id: Generated<string>;
  ritual_id: string;
  order_index: number;
  type: T;
  name: string;
  config: JSONColumnType<StepConfigOf<T>>;
  is_required: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Step responses table (single table with JSONB)
export interface StepResponsesTable<T extends StepType> {
  id: Generated<string>;
  ritual_completion_id: string;
  step_definition_id: string;
  value: JSONColumnType<StepResponseOf<T>>;
  response_time_ms: number | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

// ===========================================
// JSONB DATA TYPES
// ===========================================

// Step config data types (stored in JSONB)

export type BooleanStepConfigData = z.infer<
  typeof zodSchema.booleanStepConfigSchema
>;

export type CounterStepConfigData = z.infer<
  typeof zodSchema.counterStepConfigSchema
>;

export type QnaStepConfigData = z.infer<typeof zodSchema.qnaStepConfigSchema>;

export type ScaleStepConfigData = z.infer<
  typeof zodSchema.scaleStepConfigSchema
>;

export type TimerStepConfigData = z.infer<
  typeof zodSchema.timerStepConfigSchema
>;

export type ExerciseSetStepConfigData = z.infer<
  typeof zodSchema.exerciseSetStepConfigSchema
>;

export type StepConfigOf<T extends StepType> = StepConfigMap[T];

export interface StepConfigMap {
  boolean: BooleanStepConfigData;
  counter: CounterStepConfigData;
  qna: QnaStepConfigData;
  scale: ScaleStepConfigData;
  timer: TimerStepConfigData;
  exercise_set: ExerciseSetStepConfigData;
}

export type BooleanStepResponseData = z.infer<
  typeof zodSchema.booleanStepResponseSchema
>;

export type CounterStepResponseData = z.infer<
  typeof zodSchema.counterStepResponseSchema
>;

export type QnaStepResponseData = z.infer<
  typeof zodSchema.qnaStepResponseSchema
>;

export type ScaleStepResponseData = z.infer<
  typeof zodSchema.scaleStepResponseSchema
>;

export type TimerStepResponseData = z.infer<
  typeof zodSchema.timerStepResponseSchema
>;

export type ExerciseSetStepResponseData = z.infer<
  typeof zodSchema.exerciseSetStepResponseSchema
>;

export type StepResponseOf<T extends StepType> = StepResponseMap[T];

export interface StepResponseMap {
  boolean: BooleanStepResponseData;
  counter: CounterStepResponseData;
  qna: QnaStepResponseData;
  scale: ScaleStepResponseData;
  timer: TimerStepResponseData;
  exercise_set: ExerciseSetStepResponseData;
}

// ===========================================
// UTILITY TYPES FOR OPERATIONS
// ===========================================

// Users
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// Rituals
export type Ritual = Selectable<RitualsTable>;
export type NewRitual = Insertable<RitualsTable>;
export type RitualUpdate = Updateable<RitualsTable>;

// Ritual Frequencies
export type RitualFrequency = Selectable<RitualFrequenciesTable>;
export type NewRitualFrequency = Insertable<RitualFrequenciesTable>;
export type RitualFrequencyUpdate = Updateable<RitualFrequenciesTable>;

// Ritual Completions
export type RitualCompletion = Selectable<RitualCompletionsTable>;
export type NewRitualCompletion = Insertable<RitualCompletionsTable>;
export type RitualCompletionUpdate = Updateable<RitualCompletionsTable>;

// Step Definitions
export type StepDefinition<T extends StepType> = Selectable<
  StepDefinitionsTable<T>
>;
export type NewStepDefinition<T extends StepType> = Insertable<
  StepDefinitionsTable<T>
>;
export type StepDefinitionUpdate<T extends StepType> = Updateable<
  StepDefinitionsTable<T>
>;

// Step Responses
export type StepResponse<T extends StepType> = Selectable<
  StepResponsesTable<T>
>;
export type NewStepResponse<T extends StepType> = Insertable<
  StepResponsesTable<T>
>;
export type StepResponseUpdate<T extends StepType> = Updateable<
  StepResponsesTable<T>
>;

// ===========================================
// RELATIONSHIP TYPES
// ===========================================

export type AnyStepType = StepType;
export type AnyStepDefinition = StepDefinition<AnyStepType>;
export type AnyStepResponse = StepResponse<AnyStepType>;
export type AnyStepResponseWithDefinition =
  StepResponseWithStepDefinition<AnyStepType>;

export interface RitualWithConfig extends Ritual {
  frequency: RitualFrequency;
  step_definitions: AnyStepDefinition[];
}

export type StepResponseWithStepDefinition<T extends StepType = AnyStepType> =
  StepResponse<T> & {
    step_definition: StepDefinition<T>;
  };

export interface RitualCompletionWithSteps extends RitualCompletion {
  ritual_with_config: RitualWithConfig;
  step_responses: AnyStepResponseWithDefinition[];
}

export interface UserDailySchedule {
  user_id: string;
  date: string;
  scheduled_rituals: RitualWithConfig[];
  completed_rituals: RitualCompletionWithSteps[];
}

// Alias for backward compatibility
export type RitualWithSteps = RitualWithConfig;

// User progress summary
export interface UserProgress {
  user_id: string;
  current_streak: number;
  total_completions: number;
  completion_rate: number;
  favorite_categories: RitualCategory[];
}
