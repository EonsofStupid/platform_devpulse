---
description: Formal workflow for managing the software development lifecycle from Parking Lot to Archive.
---

# Planning Lifecycle Workflow

This workflow governs the rigorous "Senior Dev" process of moving ideas to execution.

## Phase 1: Promotion (Parking Lot -> Production)
1.  **Review**: Analyze `PARKING_LOT.md` for potential features or refactors.
2.  **Discuss**: Confirm with the user which items are ready for the official backlog.
3.  **Promote**: Move agreed items from `PARKING_LOT.md` to `PRODUCTION_PLANNING.md`.

## Phase 2: Sprint Generation (Production -> Sprint)
> **CRITICAL**: This step requires reading *actual code*, not just relying on memory or previous tool outputs.

1.  **Select**: Identify items in `PRODUCTION_PLANNING.md` to tackle in the next sprint.
2.  **Audit (Code-First)**: 
    - Use `view_file` to inspect the relevant codebase.
    - Understand the *exact* context (imports, current logic) before planning.
3.  **Generate**: Create a new sprint file (e.g., `sprint_X_feature.md`) in the user's workspace.
    - This file is the **Single Source of Truth**.
4.  **Align**: Update the internal `task.md` to match the new `sprint_X.md` exactly (100% alignment).

## Phase 3: Execution
1.  **Focus**: Execute tasks *only* from the active `sprint_X.md` file.
2.  **Discipline**: Do not perform side-quests or unapproved refactors.

## Phase 4: Strict Verification & Archive (Sprint -> Archive)
1.  **Verify**:
    - Ensure all code compiles and tests pass.
    - Confirm strict alignment with the original architectural structure.
    - Audit any unused code/imports (verify duplication before deletion).
2.  **Archive**: 
    - Move the completed `sprint_X.md` to the `archive/` directory.
