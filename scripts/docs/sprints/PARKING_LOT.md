# Parking Lot

## [2026-03-07] Blocker: Relational Store Identity Mismatch

**Sprint**: SPRINT-PLATFORM-REALITY
**Task**: Task 1.1 — Consolidate boot-labels into SSOT
**Status**: RESOLVED

### Context
During research for the Platform Reality sprint, I verified the actual Rust engine code and config. The relational store wrapper and config do not match what's stored in MEMORY.md.

### The Problem
- `MEMORY.md` says: **PostgreSQL** — Relational store. Prod label: "Data Store"
- `platform.default.toml` says: `kind = "libsql"`, `path = "libsql/platform.db"`
- `systems/devpulse-engine/src/platform/stores/relational.rs` wraps `LibSqlAdapter` from clyffy
- There is ZERO PostgreSQL code anywhere in the engine

The boot-labels consolidation needs to know the correct dev-mode label. If it's LibSQL, the dev label is "LibSQL". If the plan is to migrate to PostgreSQL, the label should reflect that.

### Options Identified
1. **Option A: It's LibSQL and that's correct** — Update MEMORY.md to say LibSQL, dev label = "LibSQL", prod label = "Data Store". No migration needed.
2. **Option B: It should be PostgreSQL but hasn't been migrated yet** — Keep PostgreSQL in MEMORY.md as the target, label the current state as LibSQL in dev mode, add a migration task to the sprint.
3. **Option C: Need more research** — Investigate what the original plan was before deciding.
