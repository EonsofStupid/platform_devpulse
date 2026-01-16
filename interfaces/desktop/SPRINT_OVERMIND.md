# SPRINT: OVERMIND (The Ephemeral Sandbox)
> **Goal**: Build the "Lab" where thinking happens.
> **Philosophy**: Low-weight, Ephemeral, "Seamless Evolution".
> **Parent**: Access via `devpulse` (Home).

## 1. Governance (The Constitution)
*   **Ephemeral**: 30-day auto-eviction policy.
*   **Isolation**: Safe sandbox. Does NOT write to Core Project Memory.
*   **Graduation**: Explicit user action required to commit ideas.

## 2. Directory Structure (Strict Hyper-Modular)
`interfaces/desktop/src/lib/domains/overmind/`
*   `services/`: Ephemeral state logic (Session Replay, Vector Store).
*   `components/`: The UI Cards and Widgets.
*   `stores/`: Svelte 5 Runes for local session state.
*   `pages/`: The Dashboard layouts.
*   `utils/`: Sandbox-specific helpers.

## 3. UI Requirements
### A. The Dashboard (`OvermindDashboard.svelte`)
*   **Status Bar**: "Ephemeral Mode" indicator.
*   **Progress**: "75% - Ready to commit?".
*   **Action Bar**: `[ GRADUATE TO PROJECT ]`, `[ KEEP EXPLORING ]`.

### B. The Widgets
*   **`JourneyWidget.svelte`**: Visualizes the "Journey of the Build". Analytics, Ups/Downs. (Replaces Internal Diary).
*   **`GuardianWidget.svelte`**: Status/Conscience Indicator (Red/Green).
*   **`ExplorationCard.svelte`**: Visualizes Idea States (`✅ DECIDED`, `🤔 UNSURE`, `❓ OPEN`).

### C. Education (COSTAR)
*   **`AgentTemplatePopup.svelte`**: Modal for selecting Sub-Agents.
    *   **The Architect** (Planner).
    *   **The Creative** (UI Designer).
    *   **The Analytical** (Tech Writer).
    *   **The Carmack** (Optimizer).
    *   *Teaching the user HOW traits + instructions = Agent.*

### D. Guidance (The Classroom)
*   **`GuidePlayer.svelte`**: Interactive Session Replay / Video Player.
*   **`LessonCard.svelte`**: Tutorials ("How to CLI", "How to Prompt").

## 4. Execution Order
1.  **Scaffold**: Ensure folder structure exists.
2.  **Widgets**: Build `Explorer`, `Journey`, `Guardian`.
3.  **Education**: Build `AgentTemplatePopup`.
4.  **Dashboard**: Assemble components into `OvermindDashboard.svelte`.
5.  **Wiring**: Connect "Graduate" button to dummy console log.
