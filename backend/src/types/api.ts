// API Response Types (what we send to frontend)
export interface User {
  id: string;
  email: string;
  current_streak: number;
  proof_score: string; // Changed to string for API consistency with DB DECIMAL
  created_at: string;
}

// Base Step (for ritual templates - no completion status)
export interface Step {
  id: string;
  type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom";
  name: string;
  question?: string | undefined; // Optional for API
  weightlifting_config?: WeightliftingConfig[] | undefined; // Optional for API
  cardio_config?: CardioConfig[] | undefined; // Optional for API
  custom_config?: CustomConfig | undefined; // Optional for API
  order_index: number;
}

// Daily Step (for daily instances - with completion status)
export interface DailyStep extends Step {
  completed: boolean;
  skipped: boolean;
  answer?: StepAnswer | undefined;
  was_modified: boolean;
  completed_at?: string | undefined;
}

// Base Ritual (for templates/library)
export interface Ritual {
  id: string;
  name: string;
  description?: string | undefined; // Optional for API
  category?: string | undefined; // Optional for API
  location?: string | undefined; // Optional for API
  gear?: string[] | undefined; // Optional for API
  is_public: boolean;
  forked_from_id?: string | undefined; // Optional for API
  fork_count: number;
  completion_count: number;
  // Frequency settings
  frequency_type: "once" | "daily" | "weekly" | "custom";
  frequency_interval: number;
  frequency_data?: FrequencyData | undefined; // Optional for API
  is_active: boolean;
  steps: Step[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Daily Ritual (for daily instances)
export interface DailyRitual {
  id: string;
  user_id: string;
  ritual: Ritual;
  scheduled_date?: string | undefined;
  scheduled_time?: string | undefined;
  completed: boolean;
  was_modified: boolean;
  completed_at?: string | undefined;
  steps: DailyStep[];
}

// Configuration types (consistent with database)
export interface WeightliftingConfig {
  reps: number;
  weight: number;
  completed: boolean | null; // Can be null in DB
}

export interface CardioConfig {
  time: number;
  distance: number;
  completed: boolean | null; // Can be null in DB
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

// Request types
export interface CreateRitualRequest {
  name: string;
  is_public: boolean;
  description?: string;
  category?: string;
  location?: string;
  gear?: string[];
  frequency_type: "once" | "daily" | "weekly" | "custom";
  frequency_interval: number;
  frequency_data?: FrequencyData;
  steps: Array<{
    type: "yesno" | "qa" | "weightlifting" | "cardio" | "custom";
    name: string;
    question?: string;
    weightlifting_config?: Array<{
      reps: number;
      weight: number;
      completed?: boolean | null;
    }>;
    cardio_config?: Array<{
      time: number;
      distance: number;
      completed?: boolean | null;
    }>;
    custom_config?: {
      label: string;
      unit: string;
    };
  }>;
}

export interface CreateDailyRitualRequest {
  ritual_id: string;
  scheduled_date: string;
  scheduled_time?: string;
}

export interface UpdateDailyRitualRequest {
  scheduled_time?: string | undefined;
  steps?:
    | Array<{
        step_id: string;
        completed?: boolean;
        skipped?: boolean;
        answer?: StepAnswer;
        was_modified?: boolean;
      }>
    | undefined;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Metrics types
export interface StepMetrics {
  step_id: string;
  step_name: string;
  completion_rate: number;
  average_time?: number;
  total_completions: number;
}

export interface RitualMetrics {
  ritual_id: string;
  ritual_name: string;
  completion_rate: number;
  streak: number;
  total_completions: number;
  step_metrics: StepMetrics[];
}
