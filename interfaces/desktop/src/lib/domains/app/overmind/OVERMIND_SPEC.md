# OVERMIND SPECIFICATION (The Ephemeral Sandbox)
> **Definition**: Ephemeral sandbox for exploration, staging, and experimentation.
> **Philosophy**: "Where thinking happens." (Low-Weight Vectors).

## 1. The Core Mechanic: Ephemeral Staging
*   **State**: "Neutral Gear". You are in Parking Lot mode.
*   **Storage**: **Low-Weight Vectors** (Transient).
*   **Isolation**: does **NOT** impact Core Project Memories or Weights.
*   **Eviction Policy**:
    *   **Time**: 30-day auto-eviction unless saved.
    *   **Space**: Free space < 20% OR > 50 GB total workspace triggers eviction.
    *   **Order**: Oldest unsaved -> Oldest saved-but-exportable.

## 2. The Two Concerns
| Environment | Purpose | When Used |
| :--- | :--- | :--- |
| **OverMind (Sandbox)** | Ephemeral testing, staging, verification. | **Before** committing ideas/code to project. |
| **Classroom (Education)** | Visual lessons, tutorials, explicit teaching. | When user **requests** learning. |

## 3. UI Sandbox Requirements
### A. The Dashboard (Mockup Impl)
*   **Exploration Progress**: "75% - Ready to commit?".
*   **Action Bar**: `[ GRADUATE TO PROJECT ]`, `[ KEEP EXPLORING ]`, `[ START OVER ]`.

### B. Idea Incubation Cards
*   **Visual States**: `✅ DECIDED`, `🤔 UNSURE`, `❓ OPEN`.

### C. Sub-Agent Templates (COSTAR Education)
> **Goal**: Teach the user *how* traits + instructions = Agent.
*   **Component**: `AgentTemplatePopup.svelte` (Clean Modal).
*   **Educational Templates**:
    1.  **The Architect** (Trait: Analytical) -> Helps create Code Planners.
    2.  **The Creative** (Trait: Brainstorming) -> Helps create UI Designers.
    3.  **The Analytical** (Trait: Critical) -> Helps create Technical Writers.
*   **Flow**: User selects a template -> System displays the COSTAR breakdown -> User customizes or spawns.

## 4. Graduation Flow
1.  **Idea Arrives**: OverMind (Low Weight).
2.  **Validation**: User validates OR Gus promotes.
3.  **Action**: **GRADUATE TO PROJECT**.
4.  **Result**: Writes to `libSQL` decisions table (Core Memory).
