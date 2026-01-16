# Hyper-Modular Scaffold Definition (Bleeding Edge 2026)

> **Goal**: A directory structure that physically manifests the "Dynamic Persona" architecture.
> **Philosophy**: Folders are not just storage; they are functional components of the Agentic Lifecycle.

## 1. Cortex (`kernel/devpulse-maestro`)
**Role**: The "cortex" (State, Reasoning, Safety).
**Pattern**: Hexagonal Architecture (Ports & Adapters).

```
src/
├── lib.rs (Exports Cortex)
├── cortex/
│   ├── mod.rs
│   ├── traits/ (The Provider Traits - "The Contract")
│   │   ├── mod.rs
│   │   ├── memory.rs (trait MemoryBank)
│   │   ├── reasoning.rs (trait ReasoningEngine)
│   │   └── security.rs (trait IdentityProvider)
│   ├── adapters/ (The Concrete Implementations)
│   │   ├── mod.rs
│   │   ├── surreal.rs (impl MemoryBank)
│   │   ├── hmm.rs (impl ReasoningEngine)
│   │   └── buffer.rs (impl SafetyShim)
│   ├── domain/ (The Pure Logic)
│   │   ├── mod.rs
│   │   ├── agents.rs (Minions/Personas logic using Ports)
│   │   └── factory.rs
│   └── wiring.rs (The Composition Root - DI Container)
└── _MAINTENANCE.md
```

## 2. Engine (`systems/devpulse-engine`)
**Role**: The "Muscle" (IPC, Physics, Learning).
**Pattern**: Hexagonal Architecture.

```
src/
├── lib.rs
├── engine/
│   ├── mod.rs
│   ├── traits/ (The System Traits)
│   │   ├── mod.rs
│   │   ├── nervous.rs (trait NervousSystem)
│   │   └── telemetry.rs (trait TelemetrySink)
│   ├── adapters/ (The Tech)
│   │   ├── mod.rs
│   │   ├── rkyv.rs (impl NervousSystem)
│   │   ├── libsql.rs (impl IdentityProvider)
│   │   ├── duckdb.rs (impl TelemetrySink)
│   │   └── candle.rs (impl Distillation)
│   ├── routing/ (Signal Dispatch)
│   │   ├── mod.rs
│   │   └── envelope.rs
│   └── wiring.rs (The Composition Root - DI Container)
└── _MAINTENANCE.md
```

## 3. Lab (`../devpulse_lab`)
**Role**: The Secondary Sink & Baseline Analyzer.
**Data Store**: Embedded DuckDB (distinct from Platform) + LibSQL.

## 4. Desktop (`interfaces/desktop/src-tauri`)
*Unchanged - UI Dispatch only.*

## 5. The Data Trinity
-   **SurrealDB**: `cortex/persistence` (Vectors, Graphs).
-   **LibSQL**: `engine/persistence` (System State).
-   **DuckDB (Platform)**: `engine/telemetry` (Local Sink).
-   **DuckDB (Lab)**: Internal Lab storage (Subscriber).

## Verification
-   Directory tree must match *exactly*.
-   All files must be modules (`mod.rs`).
