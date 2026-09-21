# PHASE 3 — FORENSIC BASELINE

**Date:** 2026-09-21
**Branch:** 2.0
**Commit:** 22afa7b

---

## 1. CURRENT ARCHITECTURE

- Frontend: Vanilla HTML/CSS/JS (ES5 module pattern, no build tools)
- Backend: Supabase (PostgreSQL + Auth + RLS)
- PWA: Service Worker v3.0 with cache-first strategy
- Dependencies: @supabase/supabase-js@2 via CDN
- State Management: Global mutable State object + const X = { ... }; window.X = X;
- Rendering: Full innerHTML re-render on every state change
- CSS: Custom properties design system in css/components.css (~3095 lines)

**Key Files:**
- js/state.js (143 lines) - State + Helpers + Calendar
- js/database.js (191 lines) - Data loading layer
- js/app.js (504 lines) - App controller
- js/ui.js (646 lines) - All UI components
- js/pages.js (215 lines) - Page renderers
- js/supabase.js (160 lines) - Supabase client + auth
- js/lessons.js (182 lines) - 20 lesson definitions
- css/components.css (~3095 lines) - Full design system
- service-worker.js - PWA v3.0

---

## 2. CURRENT HABIT SCHEMA (actions table)

Columns written by code: id, profile_id, identity_id, title, subtitle, description, is_counter, completed, habit_type, lesson_id, lesson_title, minimum, normal, stretch, cue, location, environment, time, days, target, unit

Missing columns: paused, archived, start_date, created_at

Key finding: paused, archived, start_date, created_at are mentioned in IMPLEMENTATION_SUMMARY.md as needed migrations but NOT in current schema or code.

---

## 3. CURRENT DATABASE OPERATIONS

Reads: profiles, identities, actions, history, reflections, lesson_progress (all via supabaseClient.from().select().eq())
Writes: profiles upsert, actions insert/update, history insert/update/delete, reflections upsert, identities insert/update/delete, lesson_progress upsert
Delete chain in deleteAccount(): history -> reflections -> actions -> lesson_progress -> identities -> profiles -> auth.admin.deleteUser()

---

## 4. EXISTING ATOMIC HABITS MECHANICS

Working: Binary habits (toggle), Count habits (increment/decrement), Habit builder (3-step form), Identity system, Lesson system, Create habit from lesson, Reflections

Not Functional: minimum/normal/stretch stored but never used in execution; cue/location/environment/time/days stored but never used to filter Today; paused/archived don't exist in schema

---

## 5. EXISTING TIMEZONE BEHAVIOR

state.js todayISO(): Uses Intl.DateTimeFormat with State.userTimezone - timezone-aware (GOOD)
state.js formatDate(): Uses Intl.DateTimeFormat with timezone (GOOD)
state.js greeting(): Uses new Date().getHours() - local machine time NOT user timezone (BUG)
state.js quote(): Uses new Date() - local machine time (BUG)
state.js userTimezone: Set at init time, NOT persisted to Supabase
ui.js calendar(): Uses Intl.DateTimeFormat with timezone for year/month (GOOD)
ui.js renderCalendar(): Uses new Date(year, month-1, 1) and getDay() - local timezone
ui.js calculateStreak(): Uses fragile date arithmetic with setDate and regex replace
ui.js calculateHabitHealth(): Uses unsafe (new Date() - parseISODate) / 86400000

---

## 6. EXISTING HABIT EXECUTION BEHAVIOR

Today page filters State.history by today ISO date, shows all State.actions without filtering by days/paused/archived.
toggleAction(id): finds existing history record for today, deletes if exists, inserts if not.
No schedule filtering: no check of days/time/start_date/paused/archived against today.

---

## 7. EXISTING STREAK/HEALTH BEHAVIOR

calculateStreak(actionId): Iterates history sorted desc, uses d.setDate(d.getDate() - 1) - fragile
calculateOverallStreak(): Gets unique dates, iterates backwards - same fragile arithmetic
calculateBestStreak(): Uses Math.round((curr - prev) / 86400000) - unsafe date arithmetic
calculateHabitHealth(): Returns new/building/stable/struggling/needs-adjustment, uses non-existent habit.frequency and habit.created_at

---

## 8. EXISTING REFLECTION BEHAVIOR

Daily reflection: win, challenge, tomorrow. One per identity per day. Displayed in journal and day modal. No connection to habit redesign.

---

## 9. EXISTING LESSON BEHAVIOR

20 lessons in js/lessons.js. createHabitFromLesson() always creates binary habit with empty min/normal/stretch/cue. Lessons do NOT prefill habit design mechanics.

---

## 10. EXISTING PWA/AUTH BEHAVIOR

Service Worker v3.0, cache-first for non-Supabase, stale-while-revalidate for Supabase.
Auth: Email/password, Google OAuth, auth state change listener.
Security: auth.admin.deleteUser() requires service role (unsafe in client), RLS unverified.

---

## 11. CONFIRMED GAPS

1. No paused/archived/start_date/created_at columns
2. No timezone persistence in profiles
3. greeting() and quote() use local machine time
4. Streak calculations use fragile date arithmetic
5. Health calculations use unsafe date arithmetic
6. minimum/normal/stretch stored but never used
7. cue/location/environment/time/days stored but never used for filtering
8. No recovery system
9. No behavioral intelligence
10. No habit load detection
11. No weekly review
12. Lessons always create binary habits
13. Account deletion uses unsafe auth.admin.deleteUser()
14. RLS policies unverified
15. is_counter vs habit_type inconsistency

---

## 12-15. See IMPLEMENTATION_SUMMARY.md for detailed migration plans and remaining work.
