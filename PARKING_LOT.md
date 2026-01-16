# PARKING LOT

> **Status**: ACTIVE (Governance Protocol + M1 Scaffold)
> **Goal**: Rapidly capture ideas before formal planning.
> **Rule**: NO CODE. Just documentation and requirements.

## 1. Governance & Symmetry Protocol (ADR/RFC)

### Problem Statement
The AI keeps rushing to code without presenting naming choices or ensuring Maestro-Engine symmetry (lockstep). Need a strict checklist that forces Multiple Choice presentation before any implementation.

### Solution: The "Two-Key Turn" Checklist
**Senior Terminology**: Architecture Decision Record (ADR) + Lockstep Symmetry Protocol

**The Checklist (Must be filled out before ANY code)**:

#### Phase 1: RFC (Request for Comments)
For every new component, present 3 naming options:
- **Option A**: OS/System naming (e.g., `SysCall`, `ProcessManager`)
- **Option B**: Cognitive/Bio naming (e.g., `Impulse`, `LobeController`)  
- **Option C**: Pragmatic/Standard naming (e.g., `Command`, `TaskHandler`)

**Format**:
```
| Component | Option A | Option B | Option C |
| Folder    | kernel/syscalls | cortex/impulses | core/commands |
| Class     | struct ProcessManager | struct LobeController | struct TaskHandler |
| Signal    | Sig::Interrupt | Impulse::Stop | Event::Cancelled |
```

#### Phase 2: Symmetry Protocol (Maestro ↔ Engine)
For every Maestro (IP) component, define the parallel Engine (Layman) component:

```
| Maestro (IP) | Engine (Layman) | Translation Logic |
| cortex::traits::ReasoningEngine | engine::traits::NervousSystem | Impulse → SysCall |
| Impulse::Execute | Stimulus::Request | Direct mapping |
```

#### Phase 3: Constitution Check
- [ ] No flat files (deep `mod.rs` tree)
- [ ] Hexagonal (traits/ + adapters/ + wiring.rs)
- [ ] Zero-copy (rkyv for Bus)
- [ ] User approval on Maestro AND Engine changes

### Workflow
1. Document RFC choices in PARKING_LOT.md
2. User selects Option A/B/C
3. Move approved design to `implementation_plan.md`
4. Execute with selected names

---

## 2. M1 Foundation Scaffold (Hexagonal Architecture)

### Requirements
Create strictly modular, Hexagonal folder structure for Maestro & Engine.

#### Cortex Structure (`kernel/devpulse-maestro/src/`)
```
cortex/
├── traits/           # The Contracts (Ports)
│   ├── memory.rs     # trait MemoryBank
│   ├── reasoning.rs  # trait ReasoningEngine  
│   └── security.rs   # trait IdentityProvider
├── adapters/         # The Implementations
│   ├── surreal.rs    # impl MemoryBank for SurrealDB
│   ├── hmm.rs        # impl ReasoningEngine for HMM
│   └── buffer.rs     # impl SafetyShim for Verification
├── domain/           # Pure Business Logic (uses only traits)
│   ├── agents.rs     # Agent factory logic
│   └── factory.rs    # Spawn logic
└── wiring.rs         # Dependency Injection (The ONLY place that imports adapters)
```

#### Engine Structure (`systems/devpulse-engine/src/`)
```
engine/
├── traits/           # The System Contracts
│   ├── nervous.rs    # trait NervousSystem
│   └── telemetry.rs  # trait TelemetrySink
├── adapters/         # The Tech Implementations
│   ├── rkyv.rs       # impl NervousSystem (Zero-copy Bus)
│   ├── libsql.rs     # impl IdentityProvider
│   ├── duckdb.rs     # impl TelemetrySink
│   └── candle.rs     # impl Distillation
├── routing/          # Signal Dispatch
│   └── envelope.rs   # Signal wrapper
└── wiring.rs         # DI Container
```

### Signals (Tri-Layer Taxonomy)
**Layer 1 (Interface)**: CQRS - `Command`, `Query`, `Event`
**Layer 2 (Cortex)**: Cognitive - `Stimulus`, `Perception`, `Impulse`
**Layer 3 (Engine)**: OS - `SysCall`, `IO`, `Interrupt`

### Translation Flow
```
UI Command → Engine Stimulus → Cortex Impulse → Engine SysCall
```

### Dependencies Required
```toml
surrealdb = { version = "2.0", features = ["kv-mem"] }
libsql = { version = "0.6", features = ["limbo"] }
duckdb = { version = "1.1", features = ["bundled"] }
rkyv = { version = "0.7", features = ["validation"] }
quinn = "0.10"         # P2P
wgpu = "0.19"          # Global overlay
candle-core = "0.8"    # Distillation
uuid = { version = "1.10", features = ["v7", "serde"] }
```

---

## 3. Technical Debt
*(Empty)*
