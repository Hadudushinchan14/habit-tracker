# PHASE 4.5 — SUPABASE SCHEMA REMEDIATION REPORT

**Date:** 2026-09-21
**Branch:** 2.0
**Project:** wjkqnoygmeymqiuatyyt

---

## 1. LIVE SCHEMA BEFORE

### Confirmed Missing via REST API:
```
GET /rest/v1/actions?select=id,title,archived,paused,start_date,created_at
Response: {"code":"42703","message":"column actions.archived does not exist"}
```

### Schema State:
| Column | Status |
|--------|--------|
| actions.archived | **MISSING** (confirmed) |
| actions.paused | Unknown (likely missing) |
| actions.start_date | Unknown (likely missing) |
| actions.created_at | Unknown (likely missing) |
| profiles.timezone | Unknown (likely missing) |
| history.version | Unknown (likely missing) |
| weekly_reviews | Unknown (likely missing) |
| recommendations | Unknown (likely missing) |

---

## 2. SQL ACTUALLY EXECUTED

**No SQL was executed.**

Reasons:
1. Anon API key can read data but cannot execute DDL (ALTER TABLE, CREATE TABLE)
2. Supabase CLI requires authentication (browser or access token) - not available in this non-TTY environment
3. No service_role key available in codebase or environment
4. No database connection string available

The migration file `supabase/migrations/20260921_phase3_production_gate.sql` is correct and ready to execute.

---

## 3. SQL TO EXECUTE

**Option A: Supabase Dashboard SQL Editor**

1. Go to: https://supabase.com/dashboard/project/wjkqnoygmeymqiuatyyt
2. Navigate to: Database > SQL Editor
3. Paste and run:

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

**Option B: Supabase CLI (if authenticated)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref wjkqnoygmeymqiuatyyt

# Push migrations
supabase db push --linked
```

**Option C: Helper Script**

A helper script has been created at `supabase/apply_migration.sh` that automates Option B.

---

## 4. LIVE SCHEMA AFTER (EXPECTED)

After executing the migration:

| Column | Expected Status |
|--------|-----------------|
| actions.paused | present (BOOLEAN, default false) |
| actions.archived | present (BOOLEAN, default false) |
| actions.start_date | present (DATE, nullable) |
| actions.created_at | present (TIMESTAMPTZ, default now()) |
| profiles.timezone | present (TEXT, default 'UTC') |
| history.version | present (TEXT, default 'normal') |
| weekly_reviews | present (table) |
| recommendations | present (table) |

---

## 5. POSTGREST VERIFICATION

After executing the migration, verify PostgREST recognizes the new columns:

```bash
# Test via REST API
curl -X GET "https://wjkqnoygmeymqiuatyyt.supabase.co/rest/v1/actions?select=id,title,archived" \
  -H "apikey: [ANON_KEY]"
```

Expected response: Array of actions with `archived` field (default false).

If still getting PGRST204 error, the PostgREST schema cache may need to be refreshed. Try:
1. Wait 30 seconds for cache refresh
2. Or restart the Supabase project from dashboard

---

## 6. RLS STATUS

The migration does NOT modify RLS policies. Existing RLS policies remain unchanged.

### Verified Intact:
- actions RLS: unchanged
- profiles RLS: unchanged  
- weekly_reviews RLS: uses ON DELETE CASCADE, no explicit RLS added
- recommendations RLS: uses ON DELETE CASCADE, no explicit RLS added

### Recommended RLS Verification (after migration):
1. Verify authenticated users can only access their own actions
2. Verify profiles are user-specific
3. Verify weekly_reviews and recommendations follow ownership rules

---

## 7. TEST HABIT RESULT

**Test not performed** - requires live database with migration applied.

### Required Test (after migration):

1. Open the Habit Builder
2. Create a habit: "Morning Walk"
3. Expected: INSERT succeeds without PGRST204 error
4. Verify the habit appears in the list
5. Verify you can toggle completion

---

## 8. FILES CHANGED

**No repository files were modified.**

The migration file `supabase/migrations/20260921_phase3_production_gate.sql` was already correct and did not need changes.

A helper script was created but is untracked:
- `supabase/apply_migration.sh` - Shell script to automate migration via CLI

---

## 9. COMMIT HASH

**No commit created** - repository files did not need changes.

---

## 10. REMAINING BLOCKERS

### Immediate:
1. **Migration not applied** - Must be executed via Supabase dashboard or CLI
2. **PostgREST cache** - May need refresh after migration (wait 30s or restart)

### Post-Migration Verification Required:
1. Test habit creation via Habit Builder
2. Verify SELECT returns `archived` column
3. Verify RLS policies work correctly
4. Verify all Phase 3 features work (paused, archived, start_date, etc.)

---

## 11. FORENSIC FINDINGS SUMMARY

### Root Cause:
The Phase 3 production gate migration was created but never executed on the live Supabase database. The application code expects these columns to exist, but they don't.

### Why It Happened:
1. Migration file created in repository
2. No automated deployment pipeline applied it
3. No manual execution performed
4. The anon API key cannot execute DDL

### Solution:
Execute the migration via:
- **Supabase Dashboard SQL Editor** (easiest, no tooling needed)
- **Supabase CLI** (if authenticated)
- **Helper script** `supabase/apply_migration.sh`

---

## 12. REPOSITORY STATE

```bash
$ git status
On branch 2.0
Your branch is up to date with 'origin/2.0'.

Untracked files:
  supabase/apply_migration.sh  (helper script, not committed)
  supabase/config.toml          (CLI config, not committed)
  supabase/.temp/               (CLI temp files, not committed)
```

**No changes to tracked files.**

---

**End of Report**
