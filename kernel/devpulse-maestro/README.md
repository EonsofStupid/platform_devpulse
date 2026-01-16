# Kernel: devpulse-maestro (The Blackbox)

> **ROLE**: The "Brain". Proprietary IP. Pure Logic.
> **ACCESS**: `unsafe_code = "forbid"`. NO UI DEPENDENCIES.
> **VISIBILITY**: Private (publish = false).

## The Law
1.  **No Frontend Types**: This crate knows NOTHING about Svelte, Tauri, or the Desktop.
2.  **Pure Rust**: RRO, Wal, Candle interactions happen here.
3.  **Signal Output**: We emit `Signals` via `devpulse-engine`. We do not call APIs directly.

## Manifest (The Blueprint)
- `src/lib.rs`: The Entry Point.
- `src/intelligence/`: RRO Integration (Qdrant/Encoders).
- `src/senses/`: Candle/SigLip Integration.
- `src/voice/`: Kokoros Integration.

## Maintenance Checklist
- [ ] **Read First**: Check `src/lib.rs` exports.
- [ ] **Duplicate Check**: grep for logic before adding.
- [ ] **Safety Check**: Verify NO `unsafe` blocks.
[ ] Zero-Copy Compliance: Does this code utilize rkyv for internal data transfer? (Block any new JSON parsers inside the domain boundary).

[ ] Signal Protocol Alignment: Does this logic emit a standard Signal to the Event Bus (iceoryx2) instead of calling other hubs directly?

[ ] ADR Junction Lock: Does this implementation contradict a "Key Junction" stored in libSQL? (e.g., trying to use shadcn if the domain is locked to wgpu primitives).

[ ] Dependency Ghosting: Are all new imports verified against the local verified registry?

[ ] State Awareness: Does this code handle the "Tilt" state (PSF7CR)? (e.g., UI components must have a "throttled" mode).