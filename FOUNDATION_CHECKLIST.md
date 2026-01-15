# Senior Rust Foundation Checklist (Top 5% Standard)

> **Role**: Senior Reviewer
> **Objective**: Verify that the proposed `PARKING_LOT.md` blueprint establishes a robust, scalable, and "honest" foundation.

## 1. Workspace Configuration (The Root)
- [ ] **Virtual Manifest**: Is the root `Cargo.toml` a pure virtual manifest? (No `[package]`, only `[workspace]`).
- [ ] **Toolchain Pinning**: Is there a `rust-toolchain.toml` to enforce the exact Rust version (channel = "1.82" or similar) for all devs?
- [ ] **Linter Configuration**: Is there a workspace-level `clippy.toml` or `[workspace.lints]` to enforce strict typing and idiomatic rust?
- [ ] **Profile Optimization**: Are `[profile.dev]` and `[profile.release]` configured for compile times (dev) vs performance (release)?

## 2. Crate Topology & Integrity
- [ ] **Dependency Graph**: Does `kernel/maestro` (IP) strictly depend on `kernel/engine` (Facade), and NEVER the inverse?
- [ ] **Circular Dependency Check**: Are `systems/` crates properly isolated?
- [ ] **Feature Flags**: Are dependencies like `tokio`, `serde` enabled with *only* necessary features to reduce bloat?

## 3. The "Blank Structure" Verification
- [ ] **Empty Scaffolding**: Can we generate the *entire* directory tree with `0 byte` placeholder files first?
    - *Why*: proves the structure exists exactly as mapped map without hiding code inside.
- [ ] **Module Visibility**: Do `lib.rs` files explicitly define `pub mod` strategies (Facade pattern)?

## 4. Frontend/Backend Bridge
- [ ] **Type Alignment**: Is there a specific plan (e.g., `ts-rs` or manual mapping) to ensure `kernel/engine/src/signal.rs` matches the Frontend Types? 
    - *Correction*: The current plan mentions "1:1 types" but needs a mechanism to prevent drift.

## 5. Deployment & Environment
- [ ] **Git Ignore**: Is a robust `.gitignore` included (target/, node_modules/, .env)?
- [ ] **Env Guards**: Is there a `.env.example` placeholder?

---

## Gap Analysis (Current PARKING_LOT.md vs Checklist)
1.  **MISSING**: `rust-toolchain.toml` (Critical for "Top 5%" reproducibility).
2.  **MISSING**: Workspace-level `Cargo.toml` definitions (The Root `Cargo.toml` is missing from the blueprint, only leaf crates are shown).
3.  **MISSING**: `.gitignore` definition.
4.  **MISSING**: `[workspace.lints]` strategy.

## Recommendation
Update `PARKING_LOT.md` to include:
1.  The **Root** `Cargo.toml` (Workspace definition).
2.  The `rust-toolchain.toml`.
3.  The `.gitignore`.
4.  Then, execute the **Blank Structure** generation (Folders + Empty Files only).
