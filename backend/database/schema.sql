-- Minimal Rituals Database Schema
-- Virtual instances approach - only store actual completions

-- ===========================================
-- ENUMS (keep core ones)
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'user');

CREATE TYPE ritual_frequency_type AS ENUM ('once', 'daily', 'weekly', 'custom');
CREATE TYPE ritual_category AS ENUM ('wellness', 'fitness', 'productivity', 'learning', 'spiritual', 'social', 'other');
CREATE TYPE step_type AS ENUM ('boolean', 'counter', 'qna', 'timer', 'scale', 'exercise_set');

-- Progression type

-- ===========================================
-- CORE TABLES
-- ===========================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) DEFAULT '',
  role user_role DEFAULT 'user',
  current_streak INTEGER DEFAULT 0,
  timezone VARCHAR(10) DEFAULT '+00:00', -- Store UTC offset (e.g., "+05:00", "-08:00")
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
  fork_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frequency rules (how often ritual should occur)
CREATE TABLE ritual_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  frequency_type ritual_frequency_type DEFAULT 'once',
  frequency_interval INTEGER DEFAULT 1,
  days_of_week INTEGER[], -- 0-6 for custom weekly schedules
  specific_dates DATE[], -- For specific date scheduling
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_id)
);

-- NEW: Ritual completions (only when actually completed)
CREATE TABLE ritual_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER, -- How long it took
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP DEFINITIONS (templates within rituals)
-- ===========================================

CREATE TABLE step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type step_type NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- holds step-specific config (including exercise data for exercise_set type)
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_id, order_index)
);


CREATE TABLE step_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_completion_id UUID NOT NULL REFERENCES ritual_completions(id) ON DELETE CASCADE,
  step_definition_id UUID NOT NULL REFERENCES step_definitions(id) ON DELETE CASCADE,
  value JSONB NOT NULL, -- holds step-specific response data
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_completion_id, step_definition_id)
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Core indexes
CREATE INDEX idx_rituals_user_active ON rituals(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_rituals_public ON rituals(is_public) WHERE is_public = true;

CREATE INDEX idx_ritual_completions_user_date ON ritual_completions(user_id, completed_date);
CREATE INDEX idx_ritual_completions_ritual ON ritual_completions(ritual_id);

CREATE INDEX idx_step_definitions_ritual ON step_definitions(ritual_id, order_index);

-- Response indexes
CREATE INDEX idx_step_responses_completion ON step_responses(ritual_completion_id);
CREATE INDEX idx_step_responses_step_def ON step_responses(step_definition_id);

-- JSONB indexes for common queries (optional performance boost)
CREATE INDEX idx_step_responses_value_gin ON step_responses USING GIN (value);
CREATE INDEX idx_step_definitions_config_gin ON step_definitions USING GIN (config);

-- ===========================================
-- TRIGGERS
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rituals_updated_at BEFORE UPDATE ON rituals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


