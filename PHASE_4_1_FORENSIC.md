# PHASE 4.1 — FORENSIC REPORT

**Date:** 2026-09-21
**Branch:** 2.0
**Commit:** acaee46

---

## CALENDAR ROOT CAUSE

**File:** js/ui.js line 230
**Bug:** `weekday: 'numeric'` is not a valid Intl.DateTimeFormat weekday option.
**Valid options:** "long", "short", "narrow"
**Effect:** RangeError — "Value numeric out of range for Intl.DateTimeFormat options property weekday"
**Crash path:** renderCalendar → calendar → pages.calendar → render

**Fix:** Replace with `new Date(year, month - 1, 1).getDay()` which returns 0=Sunday..6=Saturday, matching the calendar grid starting with Sunday.

## TODAY RENDERING ARCHITECTURE

todayPage() renders:
1. Hero (greeting, headline, quote)
2. Identity card (WHO ARE YOU BECOMING?)
3. Change Identity button
4. Progress ring (completion count / active habits)
5. Section header (Today's Actions X/Y)
6. Recovery section (if overdue habits)
7. Recommendations section (if any)
8. Action cards (habit list)
9. Empty state (if no habits)
10. "+ New Action" button
11. Bottom sheet (habit builder)

## TODAY VISUAL PROBLEMS

1. Progress ring broken — `--progress` CSS variable not set inline, ring always shows 0%
2. Identity card on Today is redundant — also shown on Identity page
3. Recovery section CSS classes exist but styling needs polish
4. Recommendations cards need better visual hierarchy
5. Empty state message is generic
6. No loading skeleton for Today
7. Calendar weekday crash prevents calendar from opening

## TODAY CSS CONFLICTS

- `.identity-card` class used in ui.js but not defined in new components.css
- `.recovery-section`, `.recovery-card`, `.recovery-intro` added but may conflict with existing
- `.intelligence-section`, `.intel-card` added but may conflict
- `.progress-ring` CSS uses `--progress` variable but JS doesn't set it inline
- `.badge` classes referenced in JS but not all defined

## TODAY DATA/STATE PROBLEMS

- `completedToday` counts ALL history records for today across ALL actions, not just completed ones
- `activeActions` filters correctly for due today
- Recovery checks `wasHabitMissedYesterday` correctly
- Recommendations use existing `getRecommendations()` logic

## SUPABASE TIMEZONE DEPENDENCY

- `getProfile()` upserts `timezone` column into profiles
- Migration `20260921_phase3_production_gate.sql` adds `timezone` column to profiles
- Migration NOT executed on Supabase project → PGRST204 error
- Frontend fallback exists but error is still thrown to console
- Must keep timezone support — do NOT remove

## PHASE 3 FUNCTIONALITY MUST REMAIN

- Due-today filtering ✓
- Schedule (days, paused, archived, start_date) ✓
- Habit types (binary, count, quantity, duration, limit) ✓
- Minimum/normal/stretch ✓
- Cue/location ✓
- Recovery (never miss twice) ✓
- Health ✓
- Recommendations ✓
- Identity evidence ✓
- Lesson progress ✓
- Weekly review ✓

## FILES REQUIRING MODIFICATION

1. js/ui.js — calendar crash fix, today page polish, progress ring fix
2. js/supabase.js — graceful profile error handling
3. css/components.css — identity-card CSS, progress-ring inline style support
4. css/pages.css — today-specific polish if needed
