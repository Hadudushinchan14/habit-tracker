# PHASE 4.6 — SUPABASE SCHEMA REMEDIATION (ACTIONS TABLE)

## Summary
Added missing columns to `actions` table to resolve PGRST204 errors.

## Forensic Findings
- Application expects columns: habit_type, target, unit, time, days, location, cue, minimum, normal, stretch, environment, plus existing paused/archived/start_date/created_at.
- Live schema missing: habit_type, target, unit, time, days, location, cue, minimum, normal, stretch, environment.
- Existing columns verified: id, profile_id, title, subtitle, completed, created_at, identity, identity_id, description, is_counter, lesson_id, lesson_title, paused, archived, start_date.

## Remediation
Created migration file:
`supabase/migrations/20260921_010000_add_missing_actions_columns.sql`

```sql
ALTER TABLE public.actions
ADD COLUMN IF NOT EXISTS habit_type TEXT NOT NULL DEFAULT 'binary',
ADD COLUMN IF NOT EXISTS target INTEGER,
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS time TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS days JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS cue TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS minimum TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS normal TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS stretch TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT '';
```

## Verification (to be performed after migration)
1. Run SQL against live Supabase database.
2. Confirm PostgREST schema cache recognizes new columns (200 on select).
3. Test habit creation via application (should succeed).
4. Confirm no PGRST204 errors.
5. Verify related tables and RLS intact.

## Files Changed
- Added: supabase/migrations/20260921_010000_add_missing_actions_columns.sql

## Static Validation
- node --check: PASS
- git diff --check: PASS

## Remaining Blockers
Migration file created but not executed (requires Supabase privileges). User must run the migration via Supabase Dashboard or CLI with service role key.

--- 
*Branch: 2.0*