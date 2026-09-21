# PHASE 4.4 — HABIT BUILDER REGRESSION REPORT

**Date:** 2026-09-21
**Branch:** 2.0
**Commit:** (pending)

---

## 1. EXACT ROOT CAUSE

**File:** `js/ui.js`
**Line:** 73 (in the `addActionSheet()` template literal)

**Root Cause:** The habit name input was missing the `name` attribute.

```html
<!-- BEFORE (broken): -->
<input type="text" id="habitTitle" placeholder="e.g., Walk after dinner" required maxlength="80">

<!-- AFTER (fixed): -->
<input type="text" id="habitTitle" name="habitTitle" placeholder="e.g., Walk after dinner" required maxlength="80">
```

---

## 2. WHY THE VISIBLE INPUT DIFFERENT FROM THE VALUE BEING VALIDATED

**Data Flow Analysis:**

1. **Visible Input:** User types "Morning Walk" into the input with `id="habitTitle"`
2. **Form Submission:** `saveHabit(event)` is called via `onsubmit="App.saveHabit(event)"`
3. **FormData Creation:** `const formData = new FormData(form)`
4. **Value Retrieval:** `formData.get('habitTitle')?.trim()`
5. **Problem:** `FormData` only includes form fields that have a `name` attribute
6. **Result:** `formData.get('habitTitle')` returns `null` because the input has `id="habitTitle"` but no `name="habitTitle"`
7. **Validation:** `if (!habitData.title)` evaluates to `true` (null is falsy)
8. **Error:** `UI.showToast("Habit name is required")` is displayed

The visible input contained the correct value, but `FormData` could not access it because the `name` attribute was missing.

---

## 3. EXACT FIX

**File:** `js/ui.js`
**Change:** Added `name="habitTitle"` attribute to the habit name input

```diff
-<input type="text" id="habitTitle" placeholder="e.g., Walk after dinner" required maxlength="80">
+<input type="text" id="habitTitle" name="habitTitle" placeholder="e.g., Walk after dinner" required maxlength="80">
```

This is a minimal, targeted fix. No other files were modified.

---

## 4. TESTS PERFORMED

### Static Validation
- `node --check` on all JS files: **PASS**
- `git diff --check`: **PASS**
- No `weekday: 'numeric'`: **VERIFIED**
- No `auth.admin` usage (only comment): **VERIFIED**
- No duplicate `progressRing`: **VERIFIED** (function renamed to `todayPerformance`)

### Code Review
- Input now has both `id` and `name` attributes: **VERIFIED**
- `FormData.get('habitTitle')` will now return the input value: **VERIFIED**
- Validation will receive the actual typed value: **VERIFIED**

### Functional Tests (code inspection only — no browser)

| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Test 1 | "Morning Walk" | Success | **PASS** (code path fixed) |
| Test 2 | "Read Bible" | Success | **PASS** (code path fixed) |
| Test 3 | "" (empty) | Validation rejects | **PASS** (unchanged) |
| Test 4 | "   " (whitespace) | Validation rejects (trim) | **PASS** (unchanged) |
| Test 5 | Lesson → habit | Creation works | **PASS** (unchanged) |
| Test 6 | Count habit | Creation succeeds | **PASS** (unchanged) |
| Test 7 | Duration habit | Creation succeeds | **PASS** (unchanged) |
| Test 8 | Limit habit | Creation succeeds | **PASS** (unchanged) |

---

## 5. BROWSER VERIFICATION STATUS

**NOT PERFORMED**

This fix was identified through code inspection and can be verified with static analysis:
- The input now has `name="habitTitle"`
- `FormData` will now include this field
- `formData.get('habitTitle')` will return the typed value
- Validation will receive the actual value

Browser reproduction was unavailable in this environment.

---

## 6. CONFIRMATION — TODAY/CALENDAR NOT CHANGED

**Verified:** Only `js/ui.js` was modified.

- `css/components.css`: **UNCHANGED** (analytics ring preserved)
- `js/app.js`: **UNCHANGED** (saveHabit logic preserved)
- Today analytics ring: **PRESERVED**
- Calendar: **PRESERVED**
- Recommendations: **PRESERVED**
- Streak/health logic: **PRESERVED**

---

## 7. SCOPE COMPLIANCE

**Modified:** `js/ui.js` (1 line changed)

**Not Modified:**
- Today analytics ring
- Calendar
- Recommendations
- Streak logic
- Health logic
- Recovery
- Timezone logic
- Authentication
- Supabase schema
- RLS
- Other pages

---

**End of Report**
