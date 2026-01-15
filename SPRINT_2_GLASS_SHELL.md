# Sprint 2: The Glass Shell (User Interface)

> **Status:** PLANNING
> **Goal:** A functional "Mad Scientist" Shell (Frame, Sidebar, State).
> **Input:** `sprint_1_foundation.md` (Must be complete).

## 1. Global State (Runes)
**File:** `src/lib/sys/app_state.svelte.ts`
- `sidebar_expanded`: boolean
- `theme_mode`: string
- `background_asset`: string (Dynamic)
- `glass_tint`: string (Dynamic)

## 2. Layout Components
**File:** `src/lib/layouts/app/Frame.svelte`
- Implementation: CSS Grid
- Feature: Dynamic Background Binding
- Feature: Zero Scrollbars (Glass Pane handles overflow)

**File:** `src/lib/layouts/app/Sidebar.svelte`
- Implementation: Flexbox
- Feature: Animated Activity Icon
- Feature: Route Navigation (`appState.setView`)

**File:** `src/lib/layouts/app/TopBar.svelte`
- Feature: Breadcrumbs
- Feature: User Badge

## 3. Verification
- [ ] Launch `cargo xtask verify-dogfood`
- [ ] Verify Sidebar toggle works.
- [ ] Verify Background changes when "DevMaestro" is clicked.
