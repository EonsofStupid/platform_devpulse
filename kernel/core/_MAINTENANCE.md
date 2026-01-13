# Kernel Core Maintenance Protocol

## REQUIRED_STEP 1: No Duplication
- Before acting, run `grep "StructName" . -r` to ensure you aren't recreating a type.
- IF a type exists in `systems/engine`, MOVE it here. Core is the Single Source of Truth.

## REQUIRED_STEP 2: Architecture Check
- **Files**: Types ONLY. No business logic.
- **Dependencies**: Minimal (serde, uuid, chrono). NO heavy crates.
- **Pattern**: `Signal` = `Header` + `SignalKind`. Do not break this envelope.

## REQUIRED_STEP 3: View Before Write
- You MUST read `src/types/mod.rs` before adding a new module.
- You MUST read `src/lib.rs` to verify exports.

## REQUIRED_STEP 4: The Elite Build Protocol
- **Warnings are NOT Noise**: A warning (dead_code, unused_import) means you FAILED to finish the logic.
- **Do Not Delete**: Do not strictly delete unused code to silence clippy. Implement the missing logic that *uses* it.
- **Verify**: `cargo check` must pass with 0 warnings before moving to the next task.
