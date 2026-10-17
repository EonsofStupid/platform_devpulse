---
description: Strict protocol for running cargo tests and handling build warnings/errors.
---

# Cargo Test Protocol (The "No Shortcuts" Law)

## 1. Pre-Flight Checks
- [ ] **No Duplication**: Run `grep "StructName" . -r` before adding types.
- [ ] **Architecture Check**: Verify usage of `systems/engine` as SSOT.
- [ ] **View Before Write**: Read `src/lib.rs` and `mod.rs` before editing.

## 2. The Verification Loop
1.  Run `cargo check --workspace`.
2.  **STOP** on any warning or error.
3.  **Analyze**:
    -   **Unused Imports/Code**: Do NOT delete. This indicates incomplete implementation.
    -   **Action**: Implement the logic that consumes the code.
    -   **Duplicate**: Only delete if strictly proven to be a duplicate.
4.  **Prohibit**:
    -   Deleting code to make the build pass.
    -   Commenting out code to silence errors.
    -   "Chasing success" (ignoring root causes).

## 3. The Pause
- If a build fails, **DO NOT** immediately retry with a hack.
- **PAUSE**.
- **PLAN** the remediation.
- **ASK** if unsure.
