# HABIT TRACKER - FORENSIC TECHNICAL AUDIT REPORT

**Date:** 2026-09-21  
**Branch:** 2.0  
**Commit:** 6d308fc  

---

## 1. ORIGINAL ARCHITECTURE

### 1.1 Technology Stack
- **Frontend:** Vanilla HTML/CSS/JS (ES6 modules not used)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **PWA:** Service Worker with cache-first strategy
- **Dependencies:** @supabase/supabase-js@2 (CDN)

### 1.2 File Structure
```
/habit-tracker/
├── index.html
├── manifest.json
├── service-worker.js
├── css/theme.css (empty)
├── css/layout.css
├── css/components.css (~4000 lines)
├── css/pages.css
├── js/supabase.js
├── js/state.js
├── js/database.js
├── js/lessons.js (20 lessons)
├── js/ui.js (~2000 lines)
├── js/pages.js
└── js/app.js
```

### 1.3 Data Model (Inferred)
| Table | Key Fields |
|-------|------------|
| `profiles` | `id`, `user_id`, `email`, `identity` |
| `identities` | `id`, `profile_id`, `name`, `created_at` |
| `actions` | `id`, `profile_id`, `identity_id`, `title`, `subtitle`, `description`, `is_counter`, `completed`, `lesson_id`, `lesson_title` |
| `history` | `id`, `profile_id`, `identity_id`, `action_id`, `date`, `value` |
| `reflections` | `id`, `profile_id`, `identity_id`, `reflection_date`, `win`, `challenge`, `tomorrow` |
| `lesson_progress` | `profile_id`, `identity_id`, `lesson_id`, `response` |

---

## 2. MAJOR WEAKNESSES FOUND

### 2.1 Critical Bugs
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **UTC Date Bug** | Multiple files | All "today" uses UTC, not local timezone |
| 2 | **Double `loadActions()`** | `database.js:27,30` | Wasted DB calls |
| 3 | **Duplicate `identity()`** | `pages.js:88,159` | Second overwrites first |
| 4 | **Race Condition Profile** | `supabase.js:40-58` | Check-then-insert |
| 5 | **State Mutation in Render** | `pages.js:65` | Mutates source state |

### 2.2 Architecture Problems
- No reactivity - full page re-render on every interaction
- Global mutable `State` object
- No loading/error states for async operations
- Inline event handlers (`onclick="..."`)
- Massive `ui.js` (2000+ lines)
- No TypeScript, no tests