# Xtask: The Orchestrator

> **ROLE**: The "God Mode". Build System.
> **ACCESS**: Root Control.
> **VISIBILITY**: Internal Tool.

## The Law
1.  **Single Source of Truth**: This runs the build, the dev server, the tests.
2.  **Dual Boot**: `run-dev` MUST launch Platform and Lab.
3.  **Dogfood Verification**: "Test" means **RUNNING THE APP**. We verify by *using* the Chat/AI stack.

## Manifest
- `src/main.rs`: The CLI logic.

## Maintenance Checklist
- [ ] **Shell Safety**: Use `xshell` for all operations. No raw `std::process`.
- [ ] **Dogfooding**: Ensure `test-release` spins up the actual UI + Intelligence.
