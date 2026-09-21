-- PHASE 3 P0 Production Gate Migrations
-- Run these on your Supabase project before deploying.
-- Additive, backward-compatible, safe for existing data.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

ALTER TABLE actions ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT false;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE history ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'normal';

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  summary JSONB,
  adjustments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  evidence JSONB,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actions_profile_identity ON actions(profile_id, identity_id);
CREATE INDEX IF NOT EXISTS idx_history_profile_identity_date ON history(profile_id, identity_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_profile_week ON weekly_reviews(profile_id, week_start);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile_dismissed ON recommendations(profile_id, dismissed);
