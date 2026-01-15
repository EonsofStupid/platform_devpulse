# Production Readiness Checklist (Pre-Scaffold)

> **Goal**: Ensure `PARKING_LOT.md` Blueprint meets "Top 5%" Senior Rust Standards before execution.
> **Status**: IN_PROGRESS

## 1. Workspace Root Infrastructure
- [ ] **Root Cargo.toml**: Define the Virtual Workspace explicitly.
    - *Requirement*: Must exclude `lab` (sister repo) but include `kernel` and `systems` and `interfaces`.
    - *Findings*: Need to define specific `[workspace.members]` and `[workspace.dependencies]` (Unified Versions).
- [ ] **Toolchain Management**: Define `rust-toolchain.toml`.
    - *Requirement*: Pin to `1.84` (2024 Edition support) or latest stable.
    - *Findings*: [To Be Investigated]

## 2. Code Quality & Hygiene
- [ ] **Git Ignore**: Define strict `.gitignore`.
    - *Requirement*: Ignore `target/`, `node_modules/`, `**/.DS_Store`, `.env`.
- [ ] **Linter Configuration**: Define `clippy.toml` or `[workspace.lints]`.
    - *Requirement*: Enforce standard Rust idioms and ban specific anti-patterns.

## 3. Architecture Integrity
- [ ] **Type Alignment Plan**: Define how `kernel/engine` types sync to `interfaces/desktop`.
    - *Findings*: Currently "Hand Waved". Needs concrete mechanism (e.g., `ts-rs` export or verify step).
- [ ] **Dependency Graph Validation**: Ensure strict layer separation (Maestro -> Engine -> Desktop).

## 4. Lab Separation
- [ ] **Isolation Verify**: Ensure Lab is strictly `../devpulse_lab` and not a workspace member.
    - *Findings*: Blueprint lists it as "Sister Repo". Need to confirm directory traversal implications.

---
*This document will be updated with specific findings before modifying the Master Blueprint.*

## 5. COSTAR Decision Matrix (User Input Required)
> Please select the option that matches your intent.

**D1. Dependency Management Strategy**
*Context*: Senior repos often unify versions at the root to prevent conflict.
- [ ] **A (Unified)**: Use `[workspace.dependencies]` in Root Cargo.toml. All crates inherit strict versions.
- [ ] **B (Independent)**: Each crate manages its own versions. (Easier, but messier).

**D2. Type Synchronization (Rust -> TS)**
*Context*: We need `kernel/engine` signals to match `desktop` UI code accurately to avoid "Drift".
- [ ] **A (Strict Automation)**: Use `ts-rs` or `specta` to auto-generate TypeScript definitions from Rust structs.
- [ ] **B (Manual Contract)**: We manually verify they match. (High risk of drift).

**D3. Linter Strictness (Senior Standard)**
*Context*: How much "nagging" do you want from the compiler?
- [ ] **A (Pedantic)**: `deny(clippy::pedantic)`. Forces explicit, high-quality code.
- [ ] **B (Standard)**: `warn(clippy::all)`. Good enough for most.
- [ ] **C (Maximalist)**: `deny(warnings)`. Zero tolerance for any sloppy code.

**D4. The Lab Connection**
*Context*: Lab is `../devpulse_lab` (Sister Repo).
- [ ] **A (Invisible)**: The Main Workspace knows NOTHING about Lab.
- [ ] **B (Loose Link)**: We add a `[patch]` or `path` ref only when developing locally.
