# Supabase Schema Migration Instructions

## Problem

The live Supabase database is missing columns required by the application:
- `actions.archived` (causing PGRST204 error)
- `actions.paused`
- `actions.start_date`
- `actions.created_at`
- `profiles.timezone`
- `history.version`
- `weekly_reviews` table
- `recommendations` table

## Why Automated Fix Failed

1. **Anon API key** can read data but cannot execute DDL (ALTER TABLE, CREATE TABLE)
2. **Supabase CLI** requires authentication (browser or access token) - not available in this environment
3. **Service role key** not available in codebase or environment
4. **Database connection string** not available

## Solution: Manual Migration via Supabase Dashboard

### Step 1: Open SQL Editor

1. Go to: https://supabase.com/dashboard/project/wjkqnoygmeymqiuatyyt
2. Click on **Database** in the left sidebar
3. Click on **SQL Editor**

### Step 2: Run Migration

Copy and paste the following SQL into the editor and click **Run** (or press Ctrl+Enter):

```sql
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
```

### Step 3: Wait for Cache Refresh

After running the migration:
1. Wait 30-60 seconds for PostgREST schema cache to refresh
2. The error should disappear

### Step 4: Verify Migration

Run this query in the SQL Editor to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'actions' 
ORDER BY ordinal_position;
```

You should see: `id`, `title`, `paused`, `archived`, `start_date`, `created_at`, and other existing columns.

### Step 5: Test Application

1. Open your habit tracker application
2. Try creating a new habit via the Habit Builder
3. The PGRST204 error should no longer appear
4. The habit should be created successfully

---

## Alternative: Supabase CLI (if you prefer command line)

If you have the Supabase CLI installed and authenticated:

```bash
# Install Supabase CLI (if not already)
npm install -g supabase

# Login (opens browser)
supabase login

# Link to your project
supabase link --project-ref wjkqnoygmeymqiuatyyt

# Push migrations
supabase db push --linked
```

Or use the helper script:

```bash
# Set your service role key (from dashboard Settings > API)
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Run migration
node supabase/run_migration.js
```

---

## Troubleshooting

### Still getting PGRST204 after migration?

1. Wait longer (up to 2 minutes) for cache refresh
2. Restart your Supabase project from the dashboard
3. Clear browser cache
4. Hard refresh the application (Ctrl+Shift+R)

### Migration failed?

Check the SQL Editor output for error messages. Common issues:
- Table already has the column (use IF NOT EXISTS - already in migration)
- Permission denied (make sure you're the project owner)
- Syntax error (copy the SQL exactly as provided)

---

## Verification Queries

After migration, verify with these queries:

```sql
-- Check actions table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'actions' 
ORDER BY ordinal_position;

-- Check profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check for new tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('weekly_reviews', 'recommendations');
```

---

## Files Created

- `supabase/apply_migration.sh` - Shell script to automate via CLI
- `supabase/run_migration.js` - Node.js script to automate via service_role key
- `PHASE_4_5_SUPABASE_SCHEMA_REMEDIATION_REPORT.md` - Full forensic report

---

## Contact

If you need help:
1. Check Supabase docs: https://supabase.com/docs
2. Supabase support: support@supabase.com
3. Community forum: https://github.com/supabase/supabase/discussions
