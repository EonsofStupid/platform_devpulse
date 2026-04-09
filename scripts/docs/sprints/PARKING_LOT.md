# Parking Lot — Active Decision Points

## [2026-04-02] Blocker: App Unresponsive on Window Blur

**Sprint**: SPRINT-MODEL-LOADER-WIRING
**Task**: General app interaction quality
**Status**: AWAITING_DECISION

### Context
User reports app becomes completely unresponsive when clicking away from the window (losing OS focus). This affects ALL polling, event listeners, and UI interaction — not just model-loader.

### The Problem
Tauri 2 uses WebView2 (Windows) / WebKit (macOS) as the rendering engine. When the browser window loses OS focus, the engine throttles JavaScript:
- `setInterval` callbacks throttled to ~1/minute instead of their configured rate
- Tauri event listeners (`listen()`) stop processing
- UI becomes "frozen" — clicks don't register, inputs don't accept typing
- On refocus, there's a burst of queued events that can cause jank

This is Chromium/WebView2 standard behavior for background tabs/windows. DevPulse uses `setInterval` for hardware polling (2s), and Tauri `listen()` for model loading events — both stop working.

### Options Identified

1. **Option A: Window focus/blur lifecycle in sys/ layer**
   - Add a `WindowFocusState` rune in `sys/runes/` that listens to `document.visibilitychange` and `window.focus/blur`
   - All polling runes check `windowFocusState.visible` before scheduling
   - On refocus: trigger a single refresh instead of replaying queued intervals
   - **Tradeoff**: Simple, Svelte-native, but doesn't fix Tauri event listeners

2. **Option B: Tauri-side focus event bridge**
   - Listen to window focus/blur events in Rust (`window.on_window_event`)
   - Emit `"platform:window-focus"` / `"platform:window-blur"` Tauri events
   - Frontend pauses polling on blur, resumes + refreshes on focus
   - **Tradeoff**: More robust (Rust knows the real OS focus state), but needs both Rust + Svelte changes

3. **Option C: Replace setInterval with Tauri-driven polling**
   - Remove all `setInterval` from frontend
   - Add a Rust-side polling loop that emits Tauri events with fresh data
   - Frontend just listens, never polls
   - **Tradeoff**: Most correct (Rust isn't throttled by browser), biggest change, inverts the data flow

### Recommendation
Option B — Tauri knows the real OS focus state. Frontend uses it to pause/resume gracefully. On refocus, do one immediate refresh of all stale data. This is 2 files: one Rust event hook + one Svelte rune.

---

## [2026-04-09T19:10] Blocker: 7 days thrashing — complete reset needed

**Sprint**: Model Loader Wizard
**Task**: ALL — nothing works end-to-end
**Status**: AWAITING_DECISION

### Context
7 days. The wizard welcome page renders but:
- No color — 31 `--wizard-*` SD5 tokens generated, only 3 consumed
- 49 `--wiz-*` refs in domain step files still reference deleted `.wizard-shell`
- No fluid clamp — token source has raw values, no min/max ranges set
- "Let's Go" does nothing — Rust `auto_configure` returns empty/error
- Route pages exist but the domain step components are orphaned
- SD5 builds but the output isn't wired to what renders

### The Real Problem
Surface work (CSS shuffling, plans, route restructuring) instead of:
1. SD5 tokens flowing end-to-end: JSON → transform → CSS var → component
2. Rust `auto_configure` returning real data
3. One system, not two competing ones (domain steps vs route pages)

### Options

**A: Backend first, tokens second**
Fix `auto_configure` → data flows → step components render (ugly but functional) → then migrate `--wiz-*` → `--wizard-*`.
Tradeoff: Ugly first, works first.

**B: Tokens first, backend second**  
Migrate all `--wiz-*` → `--wizard-*`, add fluid clamp to wizard.json, delete old defs.
Tradeoff: Pretty but empty — still no data.

**C: Scrap domain steps, route pages only with `--wizard-*` tokens**
Delete all step .svelte files. Route pages are the ONLY UI. Already use `--wizard-*`. Fix backend.
Tradeoff: Cleanest end state. Biggest delete. No migration — old code is gone.

**D: Keep domain steps but they become dumb presentational components**
Steps stay but lose all `--wiz-*` CSS. They become ColdLight-only components that routes import. The `--wizard-*` tokens go into a shared CSS file imported by the route layout. Fix backend.
Tradeoff: Preserves domain pattern. Steps become reusable. Medium effort.
