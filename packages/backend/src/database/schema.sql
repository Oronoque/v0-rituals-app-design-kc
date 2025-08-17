-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE ritual_frequency_type AS ENUM ('once', 'daily', 'weekly', 'custom');
CREATE TYPE ritual_category AS ENUM ('wellness', 'fitness', 'productivity', 'learning', 'spiritual', 'social', 'other');
CREATE TYPE step_type AS ENUM ('boolean', 'counter', 'qna', 'timer', 'scale', 'workout');

-- Exercises related enums
CREATE TYPE exercise_body_part AS ENUM (
  'chest',
  'shoulders',
  'core',
  'arms',
  'back',
  'legs',
  'olympic',
  'full_body',
  'cardio',
  'other'
);
CREATE TYPE exercise_measurement_type AS ENUM (
  'weight_reps',
  'reps',
  'time',
  'distance_time'
);
CREATE TYPE exercise_equipment AS ENUM (
  'body_weight',
  'dumbbell',
  'barbell',
  'kettlebell',
  'band',
  'plate',
  'pull_up_bar',
  'bench',
  'machine',
  'other'
);

-- ===========================================
-- CORE TABLES
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) DEFAULT '',
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ritual templates
CREATE TABLE rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ritual_category DEFAULT 'other',
  location VARCHAR(255),
  gear TEXT[],
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  forked_from_id UUID REFERENCES rituals(id), -- For tracking forks
  fork_count INTEGER DEFAULT 0 CHECK (fork_count >= 0),
  completion_count INTEGER DEFAULT 0 CHECK (completion_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frequency rules (how often ritual should occur)
CREATE TABLE ritual_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  frequency_type ritual_frequency_type DEFAULT 'once',
  frequency_interval INTEGER DEFAULT 1 CHECK (frequency_interval > 0),
  days_of_week INTEGER[], -- 0-6 for custom weekly schedules
  specific_dates DATE[], -- For specific date scheduling
  exclude_dates DATE[], -- For excluding dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_id)
);

-- Ritual completions (only when actually completed)
CREATE TABLE ritual_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Physical quantities and values
CREATE TABLE physical_quantities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  display_unit VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  conversion_factor INTEGER NOT NULL,
  conversion_exponent INTEGER NOT NULL,
  m_exp INTEGER NOT NULL DEFAULT 0,
  kg_exp INTEGER NOT NULL DEFAULT 0,
  s_exp INTEGER NOT NULL DEFAULT 0,
  A_exp INTEGER NOT NULL DEFAULT 0,
  K_exp INTEGER NOT NULL DEFAULT 0,
  mol_exp INTEGER NOT NULL DEFAULT 0,
  cd_exp INTEGER NOT NULL DEFAULT 0
);

-- Exercises catalog
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  body_part exercise_body_part NOT NULL,
  measurement_type exercise_measurement_type NOT NULL,
  equipment exercise_equipment[] DEFAULT ARRAY[]::exercise_equipment[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP DEFINITIONS (templates within rituals)
-- ===========================================

CREATE TABLE step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  type step_type NOT NULL,
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  -- Counter
  target_count DOUBLE PRECISION,
  target_unit_reference_id UUID REFERENCES physical_quantities(id),
  -- Timer
  target_seconds INTEGER CHECK (target_seconds IS NULL OR target_seconds > 0),
  -- Scale
  min_value INTEGER,
  max_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_id, order_index)
);

-- Workout structure (optional per step)
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_definition_id UUID NOT NULL REFERENCES step_definitions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  UNIQUE(step_definition_id, order_index)
);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  target_weight_kg DOUBLE PRECISION CHECK (target_weight_kg IS NULL OR target_weight_kg >= 0),
  target_reps INTEGER CHECK (target_reps IS NULL OR target_reps > 0),
  target_seconds INTEGER CHECK (target_seconds IS NULL OR target_seconds > 0),
  target_distance_m DOUBLE PRECISION CHECK (target_distance_m IS NULL OR target_distance_m > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_exercise_id, set_number)
);

CREATE TABLE step_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_completion_id UUID NOT NULL REFERENCES ritual_completions(id) ON DELETE CASCADE,
  step_definition_id UUID NOT NULL REFERENCES step_definitions(id) ON DELETE CASCADE,
  -- Response fields
  -- counter response
  actual_count DOUBLE PRECISION,
  -- boolean response
  value_boolean BOOLEAN,
  -- timer response
  actual_seconds INTEGER CHECK (actual_seconds IS NULL OR actual_seconds >= 0),
  -- scale response
  scale_response INTEGER CHECK (scale_response IS NULL OR scale_response >= 0),
  -- qna response
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_completion_id, step_definition_id)
);

CREATE TABLE workout_set_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_response_id UUID NOT NULL REFERENCES step_responses(id) ON DELETE CASCADE,
  workout_set_id UUID NOT NULL REFERENCES workout_sets(id) ON DELETE CASCADE,
  actual_weight_kg DOUBLE PRECISION CHECK (actual_weight_kg IS NULL OR actual_weight_kg >= 0),
  actual_reps INTEGER CHECK (actual_reps IS NULL OR actual_reps >= 0),
  actual_seconds INTEGER CHECK (actual_seconds IS NULL OR actual_seconds >= 0),
  actual_distance_m DOUBLE PRECISION CHECK (actual_distance_m IS NULL OR actual_distance_m >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(step_response_id, workout_set_id)
);

-- Essential indexes
CREATE INDEX idx_rituals_user_id ON rituals(user_id);
CREATE INDEX idx_ritual_completions_user_id ON ritual_completions(user_id);
CREATE INDEX idx_ritual_completions_ritual_id ON ritual_completions(ritual_id);
CREATE INDEX idx_ritual_completions_completed_at ON ritual_completions(completed_at);
CREATE INDEX idx_step_definitions_ritual_id ON step_definitions(ritual_id);
CREATE INDEX idx_step_responses_ritual_completion_id ON step_responses(ritual_completion_id);
CREATE INDEX idx_workout_exercises_step_definition_id ON workout_exercises(step_definition_id);
CREATE INDEX idx_workout_sets_workout_exercise_id ON workout_sets(workout_exercise_id);
CREATE INDEX idx_workout_set_responses_step_response_id ON workout_set_responses(step_response_id);
CREATE INDEX idx_exercise_id_measurement_type ON exercises(id, measurement_type);