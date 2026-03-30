# SPRINT: STATE & CONFIGURATION (The Nervous System)
> **Goal**: Establish a strictly typed, hyper-modular Configuration and State architecture.
> **Philosophy**: "Rust Logic, Svelte Glass." Strict types first.

## 1. Configuration Architecture (`src/lib/cfg/`)
> **Senior Note**: We place this in `lib` to allow `$lib/cfg` imports. Root `src/cfg` breaks module purity in Svelte.

## 1. Configuration Architecture (`src/lib/cfg/`)
> **Senior Note**: Mapped from user request `src/cfg` to `src/lib/cfg` for alias support (`$lib/cfg`).
> **Data Strategy**: Objects are typed. Persistence via **SurrealDB** (Embedded) and **RocksDB**.
> **Serialization**: **rkyv** (Zero-Copy) for high-performance endpoint conversion.

*   **`lib/cfg/`**
    *   `flags.ts` (SSOT: Feature Flags & IP Protection)
    *   `devpulse/` (Home Config)
    *   `clyffy/` (The AI Kernel)
        *   `minions/` (Persona, Voice, Identity)
        *   `general.ts` (Global AI Settings, MCP Config)
    *   `overmind/` (The ThinkSpace - Top Level)
    *   `wiredfront/` (Media Hub)
        *   `pixvix/` (Overlay Config)
        *   `viziwizi/` (Editor Config)
        *   `general.ts`

**The Pattern**:
Each file exports a **Typed Configuration Object**.
*   `AIConfig`: Defines `mcp_endpoints`, `rkyv_schema`, `persona_voice`.
*   `StorageConfig`: Defines `surreal_path`, `rocksdb_connectors`.

## 2. The Atomic Rune System (`src/lib/sys/runes/`)
> **Decision**: Using **Native Svelte 5 Runes** to build our own "Atomic" system.
> **Why?**: Zustand/Jotai are React artifacts. A `.svelte.ts` file exporting a class with `$state` **IS** an Atom.

### The Pattern: "Singleton Classes"
Instead of `atom(0)`, we create "Stores" that are strict classes (State + Actions).

```typescript
// Example: lib/sys/runes/ui.svelte.ts
class UIState {
    // The "Atom"
    sidebar = $state({ expanded: false, width: 240 });
    
    // The "Action"
    toggleSidebar() {
        this.sidebar.expanded = !this.sidebar.expanded;
    }
}
export const ui = new UIState(); // Singleton
```

## 3. Clyffy Domain Architecture (`src/lib/domains/app/clyffy/`)
> **Goal**: The "God Mode" AI wrapper, but with a strict "Layman Safe" usage policy.

*   `cortex/` (**Layman Safe / Read Only**)
    *   *Purpose*: Friendly visualization of AI State (e.g., "I am thinking", "I am overwhelmed").
    *   *Constraint*: **NO** exposure of raw algorithms or prompts. Transparency = "What I am doing", not "How I do it".
*   `debug/` (**Builder Only**)
    *   *Purpose*: The "Dynamic UI" middleware & Deep Diagnostics.
    *   *Constraint*: Protected by `flags.DEV_MODE`.
*   `minions/`
    *   *Purpose*: The Chat/Voice Interface (Persona rendering).
*   `status/`
    *   *Purpose*: Health & Telemetry (Latency, Memory).

### The Hierarchy
*   `lib/sys/runes/`
    *   `global.svelte.ts` (Theme, User Session).
    *   `layout.svelte.ts` (Sidebar, Panels).
    *   `integrity.svelte.ts` (System Health, Rust Connection).

## 3. Execution Plan
1.  **Refactor**: Move `app_state.svelte.ts` -> `lib/sys/runes/global.svelte.ts`.
2.  **Scaffold Config**: Create the `lib/cfg` structure.
3.  **Scaffold Runes**: Create `ui.svelte.ts` and `clyffy.svelte.ts`.
4.  **Wiring**: Connect `Frame.svelte` to `ui.sidebar`.
