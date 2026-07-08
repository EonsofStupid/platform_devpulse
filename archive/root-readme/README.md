# DevPulse Clean Build Environment

**Status:** INITIALIZATION
**Current Sprint:** Sprint 1 - Foundation

## 🛡️ Maintenance Checklist & Boundaries
*This file is updated after every meaningful change to ensure alignment.*

- [x] **Workspace Definition**: `Cargo.toml` defines a workspace with `resolver = "2"`.
- [ ] **Shared Contract**: `shared` crate must be PURE TYPES. No heavy dependencies (AI, DB).
    - [ ] `SignalKind` (Enum) is the Single Source of Truth for system capabilities.
    - [ ] `Signal` (Struct) is the Envelope.
- [ ] **No Duplication**: Check existing files before creating new ones.
- [ ] **Dependency Verification**: All crate versions must be valid (checked via `cargo search`).

## 🏗️ Build Status
| Component | Status | Notes |
|:--- |:--- |:--- |
| **Workspace** | 🟡 In Progress | `Cargo.toml` defined. |
| **Crate: Shared** | 🔴 Pending | Types awaiting implementation. |
| **Crate: Engine** | 🔴 Pending | Scheduled for Sprint 2. |
| **Crate: Orchestrator** | 🔴 Pending | Scheduled for Sprint 3. |

## 🚀 Quick Start
```bash
cargo check
cargo test
```
[ ] Zero-Copy Compliance: Does this code utilize rkyv for internal data transfer? (Block any new JSON parsers inside the domain boundary).

[ ] Signal Protocol Alignment: Does this logic emit a standard Signal to the Event Bus (iceoryx2) instead of calling other hubs directly?

[ ] ADR Junction Lock: Does this implementation contradict a "Key Junction" stored in libSQL? (e.g., trying to use shadcn if the domain is locked to wgpu primitives).

[ ] Dependency Ghosting: Are all new imports verified against the local verified registry?

[ ] State Awareness: Does this code handle the "Tilt" state (PSF7CR)? (e.g., UI components must have a "throttled" mode).