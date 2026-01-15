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
