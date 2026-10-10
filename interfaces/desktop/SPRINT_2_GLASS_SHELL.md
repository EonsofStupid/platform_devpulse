# SPRINT 2: THE GLASS SHELL (UI FIRST)
> **Goal**: Scaffold the "Layman" Interface. The backend exists ONLY to serve this UI.
> **Philosophy**: "If I can't click it, it doesn't exist."

## 1. Domain Hierarchy (The Flow)
1.  **`Home` (DevPulse)**: The Entry Point. The Central Hub.
2.  **`OverMind` (Sandbox)**: The Lab. (Navigation from Home).
3.  **`Projects` (DevClyffy)**: The Work. (Navigation from Home).
4.  **`WiredFront` (Overlay)**: The Face. (Always available).

## 2. Phase 1: The Home Domain (DevPulse)
> **Status**: MISSING `stores/`.
> **Goal**: Create the Main Dashboard that routes to everything else.

### Tasks
- [ ] **Structure**: Ensure `lib/domains/home/{services,components,stores,pages,utils}` exists.
- [ ] **Router**: Create `HomeDashboard.svelte` (The Main Landing).
- [ ] **Navigation**: Create `NavBar.svelte` (Glassmorphic).
    -   Links to: [OverMind], [Projects], [Settings].
- [ ] **Global Styles**: Implement the Glassmorphism CSS variables (Teal/Purple/Glass).

## 3. Phase 2: The OverMind (The Sandbox)
> **Status**: Logic Defined in `OVERMIND_SPEC.md`.

### Tasks
- [ ] **Structure**: Ensure `lib/domains/overmind/{services,components,stores,pages,utils}` exists.
- [ ] **Page**: `OvermindDashboard.svelte` (The Lab Layout).
- [ ] **Widgets**:
    -   `JourneyWidget.svelte` (Build Analytics).
    -   `GuardianWidget.svelte` (Status).
    -   `ExplorationCard.svelte` (Idea States).
    -   `AgentTemplatePopup.svelte` (COSTAR Education).

## 4. Phase 3: Wiring (Dummy Signals)
- [ ] **Interactive**: Buttons must click and log to console.
- [ ] **Navigation**: Pages must route correctly.
