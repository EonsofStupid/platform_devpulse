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
