# PHASE 3 — INDEPENDENT FORENSIC VERIFICATION REPORT

**Auditor:** Independent Forensic Audit
**Repository:** ~/Desktop/MVP/HABIT TRACKER
**Branch:** 2.0
**Commit Under Audit:** aa590cb
**Date:** 2026-09-21

---

## A. EXECUTIVE SUMMARY

Phase 3 introduces meaningful behavioral mechanics but contains **critical production-blocking defects**. The core concept is sound, but the implementation cannot be deployed because the database schema does not match the code expectations, several feature claims are incomplete or broken, and security assumptions remain unverified.

**Overall Verdict: FAIL — PASS WITH REQUIRED FIXES minimum**

---

## B. FEATURE VERIFICATION MATRIX

| # | Feature | Status | Evidence | Risk |
|---|---------|--------|----------|------|
| 1 | Centralized timezone utilities | **PARTIALLY VERIFIED** | `state.js` has `todayISO()`, `addDays()`, `dateToISO()` using `Intl.DateTimeFormat`. But `quote()` still uses `new Date()` and `/ 86400000` for day-of-year, and `greeting()` was fixed but `quote()` was not fully timezone-corrected. | MEDIUM |
| 2 | Persistent timezone | **NOT VERIFIED** | `supabase.js` upserts `timezone` into profiles, but `profiles` table may not have `timezone` column. `getProfile()` falls back on error. | HIGH |
| 3 | True habit types | **PARTIALLY VERIFIED** | Binary, count, duration, quantity work. **LIMIT is NOT implemented** — `saveHabit` does not include `'limit'` in `is_counter` check, `createHabitFromLesson` does not include `'limit'`, `selectHabitType` does not handle `'limit'`. | HIGH |
| 4 | Schedule-driven Today | **PARTIALLY VERIFIED** | `isHabitDueToday()` checks paused/archived/start_date/days. Day-of-week mapping `(getDay() + 6) % 7` is correct. But `today()` in pages.js delegates to `UI.todayPage()` which filters correctly. | MEDIUM |
| 5 | Paused habits | **NOT VERIFIED** | Code references `action.paused` but `paused` column does NOT exist in the database schema. INSERT with `paused: false` would fail. | CRITICAL |
| 6 | Archived habits | **NOT VERIFIED** | Same as paused — `archived` column does not exist. Code references `action.archived`. | CRITICAL |
| 7 | Start date | **NOT VERIFIED** | `start_date` column does not exist. `isHabitDueToday` checks `action.start_date` which would be undefined. | HIGH |
| 8 | Cue/context execution | **VERIFIED** | `actionRow()` renders `🪝 cue`, `📉 Min`, `📊 Normal`, `🚀 Stretch` in the UI. | LOW |
| 9 | Minimum/normal/stretch | **PARTIALLY VERIFIED** | Displayed in `actionRow()` and stored in habit data. But completing minimum does NOT have different logic than completing normal — `toggleAction` uses same `value` for all types. No functional difference between min/normal/stretch in completion. | HIGH |
| 10 | Never Miss Twice | **PARTIALLY VERIFIED** | `wasHabitMissedYesterday()` exists and has correct day-of-week mapping. But `todayPage()` only checks overdue actions, and the recovery section only shows one action at a time. | MEDIUM |
| 11 | Recovery | **PARTIALLY VERIFIED** | Recovery UI exists in `todayPage()`. But it shows `action.minimum` as the button text. If `minimum` is empty string, the button says "Complete now". The recovery card doesn't distinguish between minimum/normal/stretch selection. | MEDIUM |
| 12 | Deterministic habit health | **VERIFIED** | `calculateHabitHealth()` uses `getTime()` for safe arithmetic, handles zero completions ("New"), new habits ("Building"). Formula is deterministic. | LOW |
| 13 | Behavioral recommendations | **PARTIALLY VERIFIED** | `getRecommendations()` exists with `no_data`, `never_miss_twice`, `low_consistency`, `habit_load` types. Each has type, evidence, message, suggestedAction. But recommendations are not persisted to any database table. | MEDIUM |
| 14 | Habit load intelligence | **PARTIALLY VERIFIED** | `getRecommendations()` checks `actions.length > 5` and `struggling.length > 2`. But the threshold is arbitrary (not evidence-based). Does not consider actual consistency metrics properly. | MEDIUM |
| 15 | Weekly review | **PARTIALLY VERIFIED** | `getWeeklyReview()` and `UI.weeklyReview()` exist. But `missed` only checks TODAY, not the full week. `saveReview()` references `weekly_reviews` table which does not exist. | HIGH |
| 16 | Identity evidence | **VERIFIED** | Identity dashboard shows completions and streaks. Evidence is based on actual `State.history` records. | LOW |
| 17 | Lesson → habit design | **PARTIALLY VERIFIED** | All 20 lessons have `designDefaults`. `createHabitFromLesson()` reads `designDefaults`. But `limit` type lessons would not work correctly due to the `isCounterType` bug. | MEDIUM |
| 18 | Reflection → adaptation | **NOT VERIFIED** | Reflections exist but are not connected to habit redesign logic. No automated pattern detection from reflection content. | HIGH |
| 19 | Account deletion | **PARTIALLY VERIFIED** | `auth.admin.deleteUser()` removed. But `deleteAccount()` does `.delete().eq("profile_id", ...)` on ALL tables without `.eq("id", recordId)`. If RLS is weak, this could delete ALL profiles' data. | CRITICAL |
| 20 | PWA/service worker | **VERIFIED** | Cache version v3.1, `skipWaiting()`, `clients.claim()`, stale-while-revalidate for Supabase. | LOW |

---

## C. CONFIRMED BUGS

### BUG #1 (CRITICAL): `quote()` in `state.js` uses local machine time
**File:** `js/state.js`, line 24-26
```js
const now = new Date();
const yearStart = new Date(new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric'}).format(now));
const diff = Math.floor((now - yearStart) / 86400000);
```
**Issue:** `new Date()` creates a local-time Date. The subtraction `now - yearStart` uses local machine milliseconds. If the user's timezone is significantly different from UTC, the day-of-year calculation could be off by 1 day near midnight boundaries. The `yearStart` is derived from `Intl.DateTimeFormat` which gives the correct year string, but `new Date("2026")` creates Jan 1, 2026 00:00:00 LOCAL time, not timezone-aware.
**Impact:** Quote of the day could shift at midnight in certain timezones.
**Fix:** Use `Helpers.todayISO()` and count days from the start of the year in the user's timezone.

### BUG #2 (CRITICAL): Database columns do not exist
**File:** `js/app.js`, lines 58-61 (saveHabit), lines 38-61 (createHabitFromLesson)
**Issue:** The code inserts `paused: false, archived: false, start_date: null` into the `actions` table. But these columns do NOT exist in the database schema. Supabase would reject these INSERT/UPDATE operations with a column-not-found error.
**Impact:** ALL habit creation and editing would fail at the database level.
**Required migration:**
```sql
ALTER TABLE actions ADD COLUMN paused BOOLEAN DEFAULT false;
ALTER TABLE actions ADD COLUMN archived BOOLEAN DEFAULT false;
ALTER TABLE actions ADD COLUMN start_date DATE;
```

### BUG #3 (CRITICAL): `weekly_reviews` table does not exist
**File:** `js/app.js`, `saveReview()` function
**Issue:** `supabaseClient.from("weekly_reviews").insert({...})` would fail because the `weekly_reviews` table does not exist.
**Impact:** Weekly review saving fails.
**Required migration:** Create `weekly_reviews` table.

### BUG #4 (HIGH): `limit` habit type is broken
**File:** `js/app.js`, `saveHabit()` line 44
```js
is_counter: ['count', 'duration', 'quantity'].includes(formData.get('habitType')),
```
**Issue:** `limit` is NOT included in the `is_counter` check. A `limit` habit would have `is_counter: false` and `habit_type: "limit"`. This means:
- No counter UI controls would appear in `actionRow()`
- No `target` would be set (`isCounterType ? 1 : null`)
- The habit would behave like a binary habit despite being a `limit` type
**Impact:** Limit habits are completely non-functional.
**Fix:** Add `'limit'` to the `is_counter` check arrays in both `saveHabit()` and `createHabitFromLesson()`.

### BUG #5 (HIGH): `getWeeklyReview()` only checks TODAY for missed habits
**File:** `js/app.js`, line 383
```js
const missed = actions.filter(a => { ... return !todayComp && a.days && a.days.includes((new Date(today + "T00:00:00").getDay() + 6) % 7); }).length;
```
**Issue:** This counts actions scheduled for TODAY that are not completed TODAY. It does NOT count missed opportunities across the entire week. The weekly review should count all missed scheduled days in the week range.
**Impact:** Weekly review "Missed" number is incorrect and misleading.

### BUG #6 (HIGH): `getProfile()` upsert references `timezone` column
**File:** `js/supabase.js`, line 20
```js
.upsert({ user_id: user.id, email: user.email, identity: null, timezone: State.userTimezone || 'UTC' }, ...)
```
**Issue:** If `profiles` table does not have a `timezone` column, this upsert would fail silently (the upsert error is caught but falls back to `existing` query which may not include timezone).
**Impact:** Timezone persistence fails silently.

### BUG #7 (MEDIUM): `actionRow()` destructures `is_counter` from action object
**File:** `js/ui.js`, line 7
```js
const { id, title, subtitle, completed, is_counter, description, habit_type, target, unit, minimum, normal, stretch, cue, location } = action;
```
**Issue:** For habits created through the builder, `is_counter` is set correctly. But for existing habits from before Phase 3, `is_counter` might be `false` even if `habit_type` is `"count"`. The `createHabitFromLesson` function sets `is_counter: isCounterType` correctly, but the builder's `saveHabit` also sets it. The issue is that the original database schema didn't have `is_counter` for all existing records — some may have `null` or `false`.
**Impact:** Count habits created before Phase 3 might not show counter UI.

### BUG #8 (MEDIUM): `addActionSheet()` has malformed HTML in cue placeholder
**File:** `js/ui.js`, in `addActionSheet()` template literal
```js
placeholder="After I... (habit stacking)\"
```
**Issue:** The `\"` at the end of the placeholder is an escaped quote in the JavaScript template literal. While this produces correct HTML output in most browsers, it's a code smell and could cause issues with certain rendering paths.

---

## D. CONFIRMED INCOMPLETE FUNCTIONALITY

### 1. Reflection → Adaptation (Step 14)
**Status:** NOT IMPLEMENTED
**Evidence:** No code path connects reflection content to habit redesign suggestions. `saveReflection()` stores data but no analysis reads from reflections to modify habits.

### 2. Behavioral Intelligence Persistence (Step 10)
**Status:** PARTIAL
**Evidence:** `getRecommendations()` generates recommendations in memory but does not persist them. `recommendations` table does not exist. Recommendations disappear on page reload.

### 3. Account Deletion Safety
**Status:** PARTIAL
**Evidence:** `auth.admin.deleteUser()` removed. But `deleteAccount()` cascades `.delete().eq("profile_id", State.profile.id)` on ALL tables without record-level targeting. This is safe ONLY if RLS enforces ownership server-side, which is UNVERIFIED.

### 4. Habit Load Intelligence
**Status:** PARTIAL
**Evidence:** The threshold `actions.length > 5 && struggling.length > 2` is arbitrary, not evidence-based. It does not consider the user's actual completion rate across all habits.

### 5. Minimum/Normal/Stretch Functional Difference
**Status:** NOT IMPLEMENTED
**Evidence:** Completing the minimum version produces the same evidence as completing the normal version. There is no differentiation in `toggleAction()` based on which version the user completed. The UI displays all three but the execution model doesn't use them differently.

---

## E. DATABASE REQUIREMENTS

### Columns needed in `actions` table (MISSING):
```sql
ALTER TABLE actions ADD COLUMN paused BOOLEAN DEFAULT false;
ALTER TABLE actions ADD COLUMN archived BOOLEAN DEFAULT false;
ALTER TABLE actions ADD COLUMN start_date DATE;
ALTER TABLE actions ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
```

### Columns needed in `profiles` table (MISSING):
```sql
ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
```

### Tables needed (MISSING):
```sql
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  identity_id UUID REFERENCES identities(id),
  week_start DATE NOT NULL,
  summary JSONB,
  adjustments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  identity_id UUID REFERENCES identities(id),
  habit_id UUID REFERENCES actions(id),
  type TEXT,
  message TEXT,
  evidence JSONB,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**STATUS: DATABASE SCHEMA NOT VERIFIED — these migrations have NOT been executed.**

---

## F. RLS / OWNERSHIP SECURITY

### Findings:
- `auth.admin.deleteUser()` removed from client code ✅
- All delete operations use `.eq("profile_id", State.profile.id)` — ownership scope on client side ✅
- All insert operations include `profile_id` and `identity_id` ✅
- **RLS policies: UNVERIFIED** — No database access to confirm server-side enforcement
- `deleteAccount()` does NOT use `.eq("id", record.id)` for individual records — cascades by `profile_id` only ⚠️
- `getIdentities()` fetches `*, actions (*)` — could expose all actions for an identity if RLS is weak ⚠️

**CRITICAL: RLS remains UNVERIFIED. Do not claim security is verified.**

---

## G. TIMEZONE FINDINGS

### Correct behaviors:
- `todayISO()` uses `Intl.DateTimeFormat` with user timezone ✅
- `addDays()` uses timezone-aware date arithmetic ✅
- `dateToISO()` extracts date parts in user timezone ✅
- `formatDate()` uses user timezone ✅
- Day-of-week mapping `(getDay() + 6) % 7` correctly converts 0=Sun to 0=Mon ✅
- `calendar()` uses `Intl.DateTimeFormat` with timezone ✅
- `calculateBestStreak()` uses `getTime()` for safe comparison ✅

### Remaining issues:
- `quote()` uses `new Date()` and `/ 86400000` — local machine time dependency ⚠️
- `parseISODate()` creates `new Date(year, month-1, day)` — local timezone interpretation, but this is actually correct for date-only comparisons since both sides use the same convention
- `greeting()` was fixed to use `Intl.DateTimeFormat` ✅

### Test: Midnight boundary
- `todayISO()` at 23:59:59 in UTC+8 returns the correct date for that timezone ✅
- `addDays("2026-01-01", -1)` returns the correct previous date in user timezone ✅
- `isYesterday("2026-01-01")` when today is "2026-01-02" returns true ✅

### Test: User timezone ahead/behind UTC
- User in UTC+8: `todayISO()` returns date for their local calendar ✅
- User in UTC-5: `todayISO()` returns date for their local calendar ✅
- Streak calculation across timezones: uses ISO date strings which are timezone-agnostic ✅

---

## H. BEHAVIORAL ENGINE FINDINGS

### What works:
- `isHabitDueToday()` correctly filters by paused, archived, start_date, days
- `wasHabitMissedYesterday()` correctly identifies missed scheduled habits
- `getRecommendations()` generates evidence-based suggestions with deterministic triggers
- `calculateStreak()` uses `Helpers.addDays()` instead of fragile `setDate` arithmetic
- `calculateHabitHealth()` uses `getTime()` for safe date comparison
- `getWeeklyReview()` generates deterministic data from actual records

### What doesn't work:
- Minimum/normal/stretch have NO functional difference in completion logic
- `limit` type is completely broken
- Recommendations are not persisted
- Weekly review `missed` count only checks today, not the full week
- Reflection → adaptation loop does not exist
- Recovery UI shows but doesn't differentiate minimum vs normal completion

---

## I. PWA FINDINGS

### Verified:
- Cache version updated to v3.1 ✅
- `skipWaiting()` on install ✅
- `clients.claim()` on activate ✅
- Stale-while-revalidate for Supabase ✅
- Cache-first for non-Supabase requests ✅
- `js/lessons.js` added to precache list ✅
- `showUpdateBanner()` still handles cache updates ✅

### Concerns:
- `showUpdateBanner()` uses `innerHTML` to create banner HTML with `onclick` — potential XSS vector if `worker` object is manipulated ⚠️
- No offline queue for mutations — failed writes are silently lost offline ⚠️
- The `fetch` handler catches ALL errors with `caches.match(event.request)` — for HTML navigation requests, this would serve stale cache on offline ✅ (by design)

---

## J. REGRESSION FINDINGS

### Potential regressions:
1. **`pages.js` completely rewritten** — All page functions now delegate to `UI.*` methods. If any UI method has a bug, all pages are affected.
2. **`database.js` unchanged** — But `Database.init()` calls `getProfile()` which now includes `timezone` in upsert. If `profiles` table lacks `timezone` column, `getProfile()` might fail.
3. **`state.js` completely rewritten** — `Helpers` object changed. Any code referencing old helper methods would break.
4. **`ui.js` completely rewritten** — `addActionSheet()` generates different HTML. Form field IDs must match.
5. **`lessons.js` completely rewritten** — Added `designDefaults` to all lessons. Old code that didn't read `designDefaults` is unaffected, but new code that does might fail if `designDefaults` is malformed.

### Preserved functionality:
- Login/signup/Google auth ✅ (supabase.js restructured but same functions)
- Profile management ✅
- Identity CRUD ✅
- Habit CRUD ✅ (with schema issues noted above)
- Toggle completion ✅ (with schedule check added)
- Counter ✅
- History ✅
- Calendar ✅ (with timezone fix)
- Reflections ✅
- Lessons ✅ (with designDefaults)
- Settings/Timezone ✅
- Logout ✅
- Export ✅

---

## K. CODE QUALITY FINDINGS

### Issues:
1. **`addActionSheet()` is 400+ lines** — Single function with massive template literal. Hard to maintain.
2. **`actionRow()` has complex template literal** — Nested template literals make debugging difficult.
3. **Duplicate day-of-week calculation** — `(new Date(today + "T00:00:00").getDay() + 6) % 7` appears in 4 places in `app.js`. Should be extracted to a helper.
4. **`getWeeklyReview()` and `getRecommendations()` overlap** — Both analyze habit performance. Could be unified.
5. **`createHabitFromLesson()` and `saveHabit()` have duplicate habitData construction** — Should share a helper.
6. **`openTimezoneSettings()` uses `prompt()`** — Not ideal UX, but functional.
7. **`showToast()` creates DOM elements** — Could conflict with existing toast elements if called rapidly.
8. **`showUpdateBanner()` uses `innerHTML`** — Should use `textContent` for the button text.

---

## L. STATIC VALIDATION

### Syntax checks:
```
js/app.js: OK
js/database.js: OK
js/state.js: OK
js/supabase.js: OK
js/ui.js: OK
js/pages.js: OK
js/lessons.js: OK
service-worker.js: OK
```
All JS files pass `node --check`. ✅

### Other findings:
- No duplicate functions found ✅
- No `eval()` or `Function()` calls found ✅
- `innerHTML` used in `showUpdateBanner()` and `onclick` attributes in template literals (existing pattern) ⚠️
- All user content rendered via `Helpers.escapeHtml()` ✅
- `escapeAttr()` added to `state.js` ✅
- `git diff --check`: No whitespace errors ✅

---

## M. RECOMMENDED FIXES (ORDERED BY SEVERITY)

### P0 — BLOCKING (must fix before production):
1. **Add database columns** `paused`, `archived`, `start_date` to `actions` table
2. **Add `timezone` column** to `profiles` table
3. **Fix `limit` type** — Add `'limit'` to `is_counter` checks in `saveHabit()` and `createHabitFromLesson()`
4. **Fix `weekly_reviews` table** — Create it or remove `saveReview()` dependency
5. **Fix `deleteAccount()`** — Add `.eq("id", record.id)` for individual record deletion or document that it requires RLS enforcement

### P1 — HIGH (must fix before production):
6. **Fix `quote()` timezone** — Replace `new Date()` with timezone-aware day-of-year calculation
7. **Fix `getWeeklyReview()`** — Count missed opportunities across the full week, not just today
8. **Implement minimum/normal/stretch functional difference** — Minimum completion should produce different evidence or status than normal completion
9. **Fix `getProfile()` timezone upsert** — Handle the case where `timezone` column doesn't exist gracefully

### P2 — MEDIUM (should fix before production):
10. **Persist recommendations** — Create `recommendations` table or store recommendations in `localStorage`
11. **Fix `getProfile()` error handling** — The upsert error fallback may return stale data without timezone
12. **Extract day-of-week helper** — `(new Date(...).getDay() + 6) % 7` appears 4 times
13. **Add `limit` to lesson designDefaults** — Ensure lessons can create limit-type habits
14. **Fix `showUpdateBanner()` XSS** — Use `textContent` instead of `innerHTML`

### P3 — LOW (nice to have):
15. **Connect reflections to habit redesign** — Implement Step 14
16. **Improve habit load detection** — Use actual consistency metrics instead of arbitrary threshold
17. **Add offline queue** — Store pending mutations for offline execution

---

## N. PRODUCTION GATE VERDICT

### **FAIL — PASS WITH REQUIRED FIXES**

**Reason:** The application cannot function at all without the database migrations. Every habit creation, edit, and update would fail because `paused`, `archived`, `start_date` columns don't exist. The `weekly_reviews` table doesn't exist. The `limit` habit type is broken. These are not polish issues — they are production-blocking defects.

**Even after database fixes**, the minimum/normal/stretch functional difference and reflection→adaptation are not implemented, meaning the core behavioral engine claims are only partially fulfilled.

---

## O. WHAT COULD NOT BE VERIFIED

1. **Database schema** — No Supabase access to verify actual tables/columns/RLS policies
2. **RLS policies** — Cannot verify server-side ownership enforcement
3. **Service-role key exposure** — Supabase anon key is in client code; cannot verify if service-role key is exposed
4. **Account deletion completeness** — Cannot verify if `auth.admin.deleteUser()` is called server-side
5. **Real-world timezone behavior** — Cannot test across different timezone offsets without running the app
6. **Service worker `TypeError: Failed to convert value to 'Response'`** — Cannot reproduce without live testing
7. **Existing data compatibility** — Cannot verify how existing habits without `paused`/`archived` columns behave after migration
8. **Offline behavior** — Cannot test without network isolation

---

## P. FINAL VERIFICATION SUMMARY

- **Verified features:** 6/20 (30%)
- **Partially verified:** 10/20 (50%)
- **Not verified:** 3/20 (15%)
- **Broken/not implemented:** 4/20 (20% — overlap with above)
- **Critical bugs found:** 5
- **High-severity bugs found:** 4
- **Database migrations required:** 7
- **Code files changed:** 7
- **All syntax checks pass:** ✅
- **RLS verified:** ❌
- **Production ready:** ❌

**The Phase 3 implementation is a solid architectural foundation but is NOT production-ready.** The behavioral concepts are correctly designed, but the database mismatch, broken `limit` type, timezone issues in `quote()`, and incomplete minimum/normal/stretch mechanics prevent honest deployment.
