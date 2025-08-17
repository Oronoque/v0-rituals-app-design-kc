import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

// ===========================================
// ENUMS
// ===========================================

export type RitualFrequencyType = "once" | "daily" | "weekly" | "custom";
export type RitualCategory =
  | "wellness"
  | "fitness"
  | "productivity"
  | "learning"
  | "spiritual"
  | "social"
  | "other";

// Added 'workout' type that was missing
export type StepType =
  | "boolean"
  | "counter"
  | "qna"
  | "timer"
  | "scale"
  | "workout";

export type ExerciseBodyPart =
  | "core"
  | "arms"
  | "back"
  | "legs"
  | "olympic"
  | "full_body"
  | "cardio"
  | "other";

export type ExerciseMeasurementType =
  | "weight_reps"
  | "reps"
  | "time"
  | "distance_time";

export type ExerciseEquipment =
  | "body_weight"
  | "dumbbell"
  | "barbell"
  | "kettlebell"
  | "band"
  | "plate"
  | "pull_up_bar"
  | "bench"
  | "machine"
  | "other";

// ===========================================
// DATABASE TABLE INTERFACES
// ===========================================

export interface Database {
  users: UsersTable;
  physical_quantities: PhysicalQuantitiesTable;
  exercises: ExercisesTable;
  rituals: RitualsTable;
  ritual_frequencies: RitualFrequenciesTable;
  ritual_completions: RitualCompletionsTable;
  step_definitions: StepDefinitionsTable;
  workout_exercises: WorkoutExercisesTable;
  workout_sets: WorkoutSetsTable;
  step_responses: StepResponsesTable;
  workout_set_responses: WorkoutSetResponsesTable;
}

// Users table
export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  current_streak: number;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

// Rituals table (templates)
export interface RitualsTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  description: string | undefined;
  category: RitualCategory;
  location: string | undefined;
  gear: string[] | undefined;
  is_public: boolean;
  is_active: boolean;
  forked_from_id: string | undefined;
  fork_count: Generated<number>;
  completion_count: Generated<number>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

// Ritual frequencies table
export interface RitualFrequenciesTable {
  id: Generated<string>;
  ritual_id: string;
  frequency_type: RitualFrequencyType;
  frequency_interval: number;
  days_of_week: number[] | undefined;
  specific_dates: string[] | undefined; // Note: These should be Date[] if you want proper type safety
  exclude_dates: string[] | undefined; // Note: These should be Date[] if you want proper type safety
  created_at: ColumnType<Date, string | undefined, never>;
}

// Ritual completions table (actual completed rituals)
export interface RitualCompletionsTable {
  id: Generated<string>;
  user_id: string;
  ritual_id: string;
  completed_at: ColumnType<Date, string | undefined, never>;
  notes: string | undefined;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface PhysicalQuantitiesTable {
  id: Generated<string>;
  name: string; // e.g. "distance", "weight", "time", "temperature", "volume", "current", "luminous_intensity"
  m_exp: number; // metre exponent
  kg_exp: number; // kilogram exponent
  s_exp: number; // second exponent
  A_exp: number; // ampere exponent
  K_exp: number; // kelvin exponent
  mol_exp: number; // mole exponent
  cd_exp: number; // candela exponent
}

export interface ExercisesTable {
  id: Generated<string>;
  name: string;
  body_part: ExerciseBodyPart;
  measurement_type: ExerciseMeasurementType;
  equipment: ExerciseEquipment[] | undefined;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Step definitions table (templates within rituals)
export interface StepDefinitionsTable {
  id: Generated<string>;
  ritual_id: string;
  order_index: number;
  type: StepType;
  name: string;
  is_required: boolean;
  // non-workout steps
  // for counter
  target_count: number | undefined; // the target count value
  target_unit_reference_id: string | undefined; // reference to physical_quantities.id
  // for timer
  target_seconds: number | undefined;
  // for scale
  min_value: number | undefined;
  max_value: number | undefined;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface WorkoutExercisesTable {
  id: Generated<string>;
  step_definition_id: string; // reference to step_definitions.id
  exercise_id: string; // reference to exercises.id
  order_index: number;
}

export interface WorkoutSetsTable {
  id: Generated<string>;
  workout_exercise_id: string; // reference to workout_exercises.id
  set_number: number;
  target_weight_kg: number | undefined;
  target_reps: number | undefined;
  target_seconds: number | undefined;
  target_distance_m: number | undefined;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Step responses table
export interface StepResponsesTable {
  id: Generated<string>;
  ritual_completion_id: string;
  step_definition_id: string;
  // Response fields
  // counter response
  actual_count: number | undefined;
  // boolean response
  value_boolean: boolean | undefined;
  // timer response
  actual_seconds: number | undefined;
  // scale response
  scale_response: number | undefined;
  // qna response
  answer: string | undefined;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface WorkoutSetResponsesTable {
  id: Generated<string>;
  step_response_id: string; // reference to step_responses.id
  workout_set_id: string; // reference to workout_sets.id
  actual_weight_kg: number | undefined;
  actual_reps: number | undefined;
  actual_seconds: number | undefined;
  actual_distance_m: number | undefined;
  created_at: ColumnType<Date, string | undefined, never>; // Added missing created_at
}

// ===========================================
// UTILITY TYPES FOR OPERATIONS
// ===========================================

// Users
export type User = Selectable<UsersTable>;
export type UserWithoutPassword = Omit<User, "password_hash">;
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

// Physical Quantities
export type PhysicalQuantity = Selectable<PhysicalQuantitiesTable>;
export type NewPhysicalQuantity = Insertable<PhysicalQuantitiesTable>;
export type PhysicalQuantityUpdate = Updateable<PhysicalQuantitiesTable>;

// Exercises
export type Exercise = Selectable<ExercisesTable>;
export type NewExercise = Insertable<ExercisesTable>;
export type ExerciseUpdate = Updateable<ExercisesTable>;

// Step Definitions
export type StepDefinition = Selectable<StepDefinitionsTable>;
export type NewStepDefinition = Insertable<StepDefinitionsTable>;
export type StepDefinitionUpdate = Updateable<StepDefinitionsTable>;

// Workout Exercises
export type WorkoutExercise = Selectable<WorkoutExercisesTable>;
export type NewWorkoutExercise = Insertable<WorkoutExercisesTable>;
export type WorkoutExerciseUpdate = Updateable<WorkoutExercisesTable>;

// Workout Sets
export type WorkoutSet = Selectable<WorkoutSetsTable>;
export type NewWorkoutSet = Insertable<WorkoutSetsTable>;
export type WorkoutSetUpdate = Updateable<WorkoutSetsTable>;

// Step Responses
export type StepResponse = Selectable<StepResponsesTable>;
export type NewStepResponse = Insertable<StepResponsesTable>;
export type StepResponseUpdate = Updateable<StepResponsesTable>;

// Workout Set Responses
export type WorkoutSetResponse = Selectable<WorkoutSetResponsesTable>;
export type NewWorkoutSetResponse = Insertable<WorkoutSetResponsesTable>;
export type WorkoutSetResponseUpdate = Updateable<WorkoutSetResponsesTable>;

// ===========================================
// RELATIONSHIP TYPES
// ===========================================

// Alias for backward compatibility

// User progress summary
export interface UserProgress {
  user_id: string;
  current_streak: number;
  total_completions: number;
  completion_rate: number;
  favorite_categories: RitualCategory[];
}

export interface WorkoutExerciseWithExercise extends WorkoutExercise {
  exercise: Exercise;
}

export interface FullWorkoutExercise extends WorkoutExerciseWithExercise {
  workout_sets: WorkoutSet[];
}

export interface StepDefinitionWithCounter extends StepDefinition {
  target_unit_with_data: PhysicalQuantity | undefined;
}

export interface FullStepDefinition extends StepDefinitionWithCounter {
  full_workout_exercises?: FullWorkoutExercise[];
}

export interface FullRitual extends Ritual {
  frequency: RitualFrequency;
  step_definitions: FullStepDefinition[];
}

export interface FullStepResponse extends StepResponse {
  workout_set_responses: WorkoutSetResponse[];
}

export interface FullRitualCompletion extends FullRitual {
  completion_data: RitualCompletion;
  step_responses: FullStepResponse[];
}

// Daily schedule types
export interface UserDailySchedule {
  user_id: string;
  date: string; // YYYY-MM-DD format
  scheduled_rituals: FullRitual[];
  completed_rituals: FullRitualCompletion[];
}
