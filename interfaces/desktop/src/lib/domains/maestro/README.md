# MAESTRO DOMAIN (The AI Interface)
> **Protocol**: IP_PROTECTION.md (Strict Enforcement)

## 1. Structure & Constraints

### 🟢 `cortex/` (Layman Safe)
*   **Audience**: The End User.
*   **Content**: Visualizations of State (Thinking, Listening, Sleeping).
*   **Rule**: **NEVER** show raw prompts, thought chains, or algorithms.
*   **Goal**: Transparency of *Activity*, not *Mechanism*.

### 🔴 `debug/` (Builder Only)
*   **Audience**: You (The Developer).
*   **Content**: Thought Graphs, Prompt Inspectors, Context Visualizers.
*   **Rule**: **MUST** be gated by `flags.DEV_MODE` or `flags.ENABLE_CONTEXT_DEBUGGER`.
*   **Safety**: If the flag is false, this component renders NOTHING.

### 🔵 `minions/` (The Face)
*   **Audience**: The User.
*   **Content**: The Persona (Gus, Architect) and Voice/Chat interfaces.
*   **Rule**: Clean, polished, and strictly typed input/output.

### 🟡 `status/` (The Pulse)
*   **Audience**: Mixed (some Layman, some Builder).
*   **Content**: Latency, Memory Usage, System Health.

## 2. Integration
*   This domain is driven by **Runes** in `src/lib/sys/runes/maestro.svelte.ts`.
*   It is configured by `src/lib/cfg/maestro/`.
