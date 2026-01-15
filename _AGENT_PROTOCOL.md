# AGENT PROTOCOL (The Constitution)

> **STATUS**: IMMUTABLE LAW
> **ROLE**: This file defines the operating constraints for the AI Agent. It must be read at the start of every context window.

## 1. The Core Directive: "Plan-Act-Reflect"
The Agent is PROHIBITED from "looping" or "trying to fix". It must strictly follow this cycle:

1.  **PLAN (Stop)**:
    -   Read the relevant code.
    -   Draft a specific `implementation_plan.md`.
    -   **WAIT** for User Approval.
2.  **ACT (Atomic)**:
    -   Execute *only* the approved steps.
    -   Do not "fix" side effects on the fly. Stop and Report.
3.  **REFLECT (Verify)**:
    -   Run verification (e.g., `cargo check`).
    -   If it fails, **STOP**. Do not retry. Update the Plan.

## 2. The Law of Maintenance
Before editing ANY file, the Agent MUST check the local `_MAINTENANCE.md`.
-   **No Deletions**: Never delete code to silence a warning. Implememt the logic.
-   **No Assumptions**: If a dependency is missing, check if it's allowed.
-   **SSOT**: `PRODUCTION_PLANNING.md` and `task.md` are the Source of Truth.

## 3. The "Atomic" Rule
Tasks must be broken down until they are binary (Pass/Fail).
-   *Bad*: "Fix the build."
-   *Good*: "Add uuid dependency to `systems/devpulse-engine/Cargo.toml`."

## 4. Anti-Hallucination Checks
-   **File Existence**: Never assume a file exists. `list_dir` first.
-   **Content Verification**: Never assume file content. `view_file` first.
-   **Command Safety**: never run `cargo build` on a broken tree. Run `cargo check -p <pkg>` first.
