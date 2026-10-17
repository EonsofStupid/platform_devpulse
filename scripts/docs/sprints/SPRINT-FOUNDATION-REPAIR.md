# SPRINT: Foundation Repair — Multi-Phase Audit Fix

**Date**: 2026-04-01
**Status**: PLAN — Owner approval required before execution
**Source**: Full structural audit of xtask, boot pipeline, config, workspace deps
**Approach**: 3 focused sprints. Each one is small enough to crush completely. No rushing.

---

## WHY THIS MATTERS

The boot pipeline has numbering errors. Config defaults contradict the TOML SSOT. xtask lies about what services exist. Validation skips critical services. Dependencies are pinned at different versions across crates. These are all foundation issues — every future sprint builds on this foundation. If this is wrong, everything we build on top will be wrong.

---

## SPRINT F1: CONFIG TRUTH — Make Code Match TOML

**Scope**: Fix every place where Rust code contradicts `platform.default.toml`.
**Size**: 7 files, ~30 line changes. 1-2 hours. Zero new features.
**Gate**: Every Rust default matches TOML. Every doc comment is accurate.

| # | Finding | File | Fix |
|---|---------|------|-----|
| 1 | `VoiceServiceEntry::default()` says enabled+critical, TOML says disabled+non-critical | `config.rs:601-607` | Change default to `enabled: false, critical: false` |
| 2 | `config.rs:59` doc says "outlines-core" | `config.rs:59` | Change to "llguidance (future sprint)" |
| 3 | `config.rs:199` doc says "outlines-core" | `config.rs:199` | Change to "llguidance (future sprint)" |
| 4 | `platform.default.toml:239-241` Python section references outlines-core | `platform.default.toml` | Update comment: "Kept for future llguidance if pyo3 needed" |
| 5 | DevForge `binary_path` TOML vs Rust disagree | `platform.default.toml:125` vs `config.rs:794` | Align both to `"deps/code-oss/bin/code-oss"` |
| 6 | Commented outlines refs in 3 engine files | `mod.rs`, `services/mod.rs`, `persistence/mod.rs` | Clean up comments to say llguidance consistently |
| 7 | Engine Cargo.toml comment misleading | `devpulse-engine/Cargo.toml:12` | Fix comment |

**Verification**: `cargo check --workspace` + manual review of every changed default against TOML.

---

## SPRINT F2: BOOT PIPELINE INTEGRITY — Numbers, Stages, Validation

**Scope**: Fix the boot pipeline so it's correctly numbered, fully documented, and validates all critical services.
**Size**: 2 files, ~50 line changes. 1-2 hours. Zero new features.
**Gate**: Boot doc comment matches reality. Every critical service is validated. Stage numbers are sequential.

| # | Finding | File | Fix |
|---|---------|------|-----|
| 1 | Boot doc comment lists 10 stages, reality is 14 | `boot/mod.rs:13-23` | Rewrite doc to list all 14 stages in order |
| 2 | Two stages both labeled "Stage 13" | `boot/mod.rs:294,302` | Renumber: DevForge=13, Validate=14 |
| 3 | `validate_critical()` skips user_graph and global_graph | `boot/mod.rs:378-451` | Add both to validation (they're critical=true in TOML) |
| 4 | boot.log — verify every stage writes to log | `boot/mod.rs` | Audit each stage call for `boot_log.ok/fail/skip` |

**The correct stage order (what the doc should say)**:

```
 1. Preflight — directory hierarchy
 2. System relational (LibSQL) — CRITICAL
 3. System analytics (DuckDB) — CRITICAL
 4. Graph store (SurrealDB) — CRITICAL (system + user + global)
 5. System cache (Moka) — CRITICAL
 6. User relational (LibSQL) — CRITICAL
 7. Vector store (RRO) — feature-gated
 8. Voice service (Kokoros) — feature-gated
 9. Grammar (llguidance) — future sprint, SKIPPED
10. Embedder (Candle) — feature-gated
11. Whisper (Candle) — feature-gated
12. Model Loader — feature-gated (inference)
13. DevForge (VSCode) — non-critical
14. Validation — verify all critical services
```

**Verification**: `cargo xtask run-dev` boots clean. boot.log shows all 14 stages with correct labels and timing.

---

## SPRINT F3: XTASK + WORKSPACE HYGIENE — Single Source of Truth

**Scope**: Fix xtask lies, dead fields, hardcoded lists. Pin workspace deps.
**Size**: 6 files, ~60 line changes. 2-3 hours.
**Gate**: xtask output matches reality. Workspace deps pinned. Zero dead fields.

### Part A: xtask cleanup

| # | Finding | File | Fix |
|---|---------|------|-----|
| 1 | Launch banner says "Outlines", wrong service count | `dev.rs:190` | Update to match actual services |
| 2 | Error message says "all 4 embedded services" | `dev.rs:164` | Update count to actual |
| 3 | Dead `onnxruntime` field in BuildDepsConfig | `workspace.rs:250` | Delete field + remove from apply_env loop |
| 4 | Python comment says "pyo3/outlines-core" | `workspace.rs:246` | Update comment |

### Part B: Workspace dependency pinning

| # | Finding | File | Fix |
|---|---------|------|-----|
| 5 | `sysinfo` at 3 versions (0.33, 0.33, 0.38) | workspace Cargo.toml | Pin `sysinfo = "0.33"` in workspace, align all crates |
| 6 | `flume` not in workspace deps | workspace Cargo.toml | Add `flume = "0.11"` to workspace deps |
| 7 | `hf-hub` not in workspace deps | workspace Cargo.toml | Add `hf-hub = "0.4"` to workspace deps |

### Part C: Stale TOML paths (document, don't delete)

| # | Finding | File | Fix |
|---|---------|------|-----|
| 8 | `build.repos.*` paths (rro, wal, tar-rs, rust-stemmers) don't exist on disk | `platform.default.toml` | Add comment: "# Consumed as git deps — path is for xtask clone target" |

**Verification**: `cargo xtask run-dev` shows accurate banner. `cargo check --workspace` with no version conflicts. `grep -r "onnxruntime" xtask/` returns nothing.

---

## WHAT IS NOT IN THESE SPRINTS

These are deferred — they matter but are not foundation:

| Item | Why Deferred | When |
|------|-------------|------|
| xtask deps.rs reading from TOML instead of hardcoded | Functional as-is, just not SSOT-pure | After F3 |
| Preflight devUrl port verification | Ports match today, guard is missing | After F3 |
| `sysinfo` 0.33 → 0.38 upgrade | Breaking API changes, needs testing | Separate sprint |
| Missing doc comments (99 in model-loader) | Cosmetic, not blocking | Separate sprint |
| net.rs stage label duplication | Display only | Whenever |

---

## EXECUTION ORDER

```
F1 (config truth)  →  F2 (boot pipeline)  →  F3 (xtask + workspace)
    1-2 hours             1-2 hours              2-3 hours
```

Each sprint is independent — if F2 takes longer than expected, F3 isn't blocked. But the order matters because F1 fixes the defaults that F2's boot pipeline reads, and F3's workspace pinning should happen after F1/F2 confirm everything compiles.

**Total: ~5-7 hours across 3 focused sprints. 15 files. ~140 line changes. Zero new features. Pure foundation.**

---

## OWNER DECISION GATES

| # | Question | Sprint | Impact |
|---|----------|--------|--------|
| 1 | `sysinfo` — pin at 0.33 (current) or upgrade all to 0.38? | F3 | If 0.38: API changes in desktop crate need fixing |
| 2 | Python/pyo3 config — keep section for future or delete entirely? | F1 | If delete: cleaner, but need to re-add if llguidance uses pyo3 |
| 3 | `build.repos` stale paths — delete entries or mark as git-only? | F3 | Delete is cleaner but loses the intended clone targets |

---

*When all 3 sprints are done: every config default matches TOML, boot pipeline is correctly numbered and validates all critical services, xtask tells the truth, and workspace deps are pinned. The foundation is real.*
