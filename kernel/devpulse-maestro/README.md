# Kernel: devpulse-maestro (The Blackbox)

> **ROLE**: The "Brain". Proprietary IP. Pure Logic.
> **ACCESS**: `unsafe_code = "forbid"`. NO UI DEPENDENCIES.
> **VISIBILITY**: Private (publish = false).

## The Law

1. **No Frontend Types**: This crate knows NOTHING about Svelte, Tauri, or the Desktop.
2. **Pure Rust**: RRO, Wal, Candle, Kokoros interactions happen here.
3. **Signal Output**: We emit `Signals` via `devpulse-engine`. We do not call APIs directly.
4. **IP Protected**: All kernel terminology is remapped at the engine boundary via `ip_term!()`.

## Structure

```
src/
├── lib.rs              # Entry point — Cortex facade
├── cortex/             # Core AI subsystem
│   ├── persistence/    # Storage adapters (LibSQL, DuckDB, SurrealDB, Moka)
│   ├── adapters/       # Integration adapters (reasoning, kv_cache, safety)
│   ├── minions/        # Sub-agents (DIARY, GUARDIAN, PSYCH, etc.)
│   ├── reasoning/      # Reasoning pipeline (HMM, chains)
│   ├── kv_cache/       # Attention sink, sliding window
│   ├── persona/        # AI persona system (Clyffy default)
│   └── traits/         # Port interfaces (memory, reasoning, security)
└── config/
    └── wiring.rs       # CortexWiring — trait object assembly
```

## Personas

- **Clyffy** — Default general persona. Named for ColdLight + Wardenclyffe.

## Dependencies (kernel-only, never exposed)

| Crate | Role |
|-------|------|
| `rro` | Reason Ready Object — vector index (Qdrant fork) |
| `candle-core` / `candle-transformers` | Local model inference |
| `ort` | ONNX Runtime inference |
| `kokoros` | Voice AI synthesis |
| `libsql` / `duckdb` / `surrealdb` / `moka` | 4-tier storage |

## Maintenance Checklist

- [ ] **Read First**: Check `src/lib.rs` exports.
- [ ] **Duplicate Check**: grep for logic before adding.
- [ ] **Safety Check**: Verify NO `unsafe` blocks.
- [ ] **Signal Alignment**: Emit via `devpulse-engine` SignalRouter, never call APIs directly.
- [ ] **IP Compliance**: Never expose kernel terms past the engine facade.
