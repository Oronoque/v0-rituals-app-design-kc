// Database row types (exact database schema representation)
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  current_streak: number;
  proof_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface RitualRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  location: string | null;
  gear: string[] | null;
  is_public: boolean;
  forked_from_id: string | null;
  fork_count: number;
  completion_count: number;
  // Frequency settings (moved from ritual_templates)
  frequency_type: "once" | "daily" | "weekly" | "custom";
  frequency_interval: number;
  frequency_data: FrequencyData | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StepRow {
  id: string;
  ritual_id: string;
  order_index: number;
  type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom";
  name: string;
  question: string | null;
  weightlifting_config: WeightliftingConfig[] | null;
  cardio_config: CardioConfig[] | null;
  custom_config: CustomConfig | null;
  created_at: Date;
  updated_at: Date;
}

export interface DailyRitualRow {
  id: string;
  user_id: string;
  ritual_id: string;
  scheduled_date: Date;
  scheduled_time: string | null;
  completed: boolean;
  was_modified: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface DailyStepRow {
  id: string;
  daily_ritual_id: string;
  step_id: string;
  completed: boolean;
  skipped: boolean;
  answer: StepAnswer | null;
  was_modified: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Configuration types for step data
export interface WeightliftingConfig {
  reps: number;
  weight: number;
  completed: boolean | null;
}

export interface CardioConfig {
  time: number;
  distance: number;
  completed: boolean | null;
}

export interface CustomConfig {
  label: string;
  unit: string;
}

// Frequency configuration types
export interface FrequencyData {
  days_of_week?: number[]; // 0-6 for Sunday-Saturday (for weekly custom)
  specific_dates?: string[]; // For specific date scheduling
  [key: string]: any; // Allow for future frequency types
}

// Step answer types
export interface WeightliftingAnswer {
  sets: Array<{ reps: number; weight: number; completed?: boolean }>;
}

export interface CardioAnswer {
  rounds: Array<{ time: number; distance: number; completed?: boolean }>;
}

export interface CustomAnswer {
  value: number;
  unit: string;
}

export type StepAnswer =
  | string
  | WeightliftingAnswer
  | CardioAnswer
  | CustomAnswer;
