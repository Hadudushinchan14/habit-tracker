# PHASE 4 — FORENSIC BASELINE

**Date:** 2026-09-21
**Branch:** 2.0
**Commit:** beec502

## ARCHITECTURE
- Single-page app, vanilla JS, no framework
- Supabase for auth + database
- CSS custom properties for tokens
- Inline HTML generation from JS
- Service Worker v3.1

## CSS ISSUES
1. Excessive glassmorphism - backdrop-filter on nearly every card
2. Inconsistent radii - 6 different sizes
3. Giant h1 - 3rem on login, 2rem on hero
4. Decorative empty states with radial gradients
5. Duplicate CSS between components.css and pages.css
6. Blue overload - too many primary shades
7. No loading skeletons
8. No form validation styles
9. Responsive only 520px/600px
10. Bottom nav emoji icons
11. theme.css is empty

## JS ISSUES
1. No loading states shown to user
2. No inline form validation
3. No empty state handling
4. Basic toast notifications
5. No general modal system
6. Error handling only console.error

## PRIORITY
P0: CSS architecture, typography, spacing, component consistency
P1: Responsive design, accessibility, loading/empty/error states
P2: Forms, microcopy, motion, PWA
