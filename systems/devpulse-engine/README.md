# Systems: devpulse-engine (The Facade)

> **ROLE**: The "Muscle" & "Translator". Public Types.
> **ACCESS**: The ONLY crate that Desktop and Kernel both touch.
> **VISIBILITY**: Public (Workspace Shared).

## The Law
1.  **Type Centrality**: If it's used in Frontend and Backend, it LIVES HERE.
2.  **Strict Serialization**: All types must derive `Serialize`, `Deserialize`, and `TS`.
3.  **Facade Pattern**: This crate hides the complexity of `wal` and `fjall`.

## Manifest (The Blueprint)
- `src/lib.rs`: Type Exports.
- `src/signals/`: The Event Bus types (Header + Kind).
- `src/rro/`: Public types for Reasoning Ready Objects (DTOs, not Logic).

## Maintenance Checklist
- [ ] **Type Check**: Did you derive `TS`?
- [ ] **Sync Check**: Run `cargo xtask export-types` after editing.
[ ] Zero-Copy Compliance: Does this code utilize rkyv for internal data transfer? (Block any new JSON parsers inside the domain boundary).

[ ] Signal Protocol Alignment: Does this logic emit a standard Signal to the Event Bus (iceoryx2) instead of calling other hubs directly?

[ ] ADR Junction Lock: Does this implementation contradict a "Key Junction" stored in libSQL? (e.g., trying to use shadcn if the domain is locked to wgpu primitives).

[ ] Dependency Ghosting: Are all new imports verified against the local verified registry?

[ ] State Awareness: Does this code handle the "Tilt" state (PSF7CR)? (e.g., UI components must have a "throttled" mode).