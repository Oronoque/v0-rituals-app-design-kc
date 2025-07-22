-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  current_streak INTEGER DEFAULT 0,
  proof_score DECIMAL(10,4) DEFAULT 1.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rituals table (stores both private and public rituals with frequency settings)
CREATE TABLE rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  location VARCHAR(255),
  gear TEXT[], -- Array of gear items
  is_public BOOLEAN DEFAULT false,
  forked_from_id UUID REFERENCES rituals(id), -- For tracking forks
  fork_count INTEGER DEFAULT 0, -- Denormalized count for performance
  completion_count INTEGER DEFAULT 0, -- Denormalized count for performance
  
  -- Frequency settings (moved from ritual_templates)
  frequency_type VARCHAR(50) DEFAULT 'once' CHECK (frequency_type IN ('once', 'daily', 'weekly', 'custom')),
  frequency_interval INTEGER DEFAULT 1, -- Every X days (1=daily, 7=weekly, etc.)
  frequency_data JSONB, -- For custom frequencies like specific days of week
  is_active BOOLEAN DEFAULT true, -- Whether this ritual is actively scheduled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Steps table (individual steps within a ritual)
CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('yesno', 'qa', 'weightlifting', 'cardio', 'custom')),
  name VARCHAR(255) NOT NULL,
  question TEXT,
  weightlifting_config JSONB, -- JSON array for weightlifting configuration
  cardio_config JSONB, -- JSON array for cardio configuration  
  custom_config JSONB, -- JSON object for custom step configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ritual_id, order_index)
);

-- Daily scheduled ritual instances
CREATE TABLE daily_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  completed BOOLEAN DEFAULT false,
  was_modified BOOLEAN DEFAULT false, -- Track if modified during execution
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ritual_id, scheduled_date)
);

-- Daily step completion tracking
CREATE TABLE daily_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_ritual_id UUID NOT NULL REFERENCES daily_rituals(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  answer JSONB, -- Store step answers (text, weightlifting data, etc.)
  was_modified BOOLEAN DEFAULT false, -- Track if modified during execution
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(daily_ritual_id, step_id)
);

-- Indexes for performance
CREATE INDEX idx_rituals_user_id ON rituals(user_id);
CREATE INDEX idx_rituals_is_public ON rituals(is_public) WHERE is_public = true;
CREATE INDEX idx_rituals_category ON rituals(category) WHERE is_public = true;
CREATE INDEX idx_rituals_active ON rituals(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_steps_ritual_id ON steps(ritual_id);
CREATE INDEX idx_steps_order ON steps(ritual_id, order_index);
CREATE INDEX idx_daily_rituals_user_date ON daily_rituals(user_id, scheduled_date);
CREATE INDEX idx_daily_rituals_date ON daily_rituals(scheduled_date);
CREATE INDEX idx_daily_steps_daily_ritual ON daily_steps(daily_ritual_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rituals_updated_at BEFORE UPDATE ON rituals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_rituals_updated_at BEFORE UPDATE ON daily_rituals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_steps_updated_at BEFORE UPDATE ON daily_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 