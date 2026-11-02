# Plan: Reliable local desktop baseline

Date: 2026-09-25
Status: DRAFT FOR OWNER REVIEW; implementation not started.
Research: [Startup map and evidence](SPRINT-DEV-RELIABILITY.research.md)

## Outcome

One documented Rust entry point starts the real desktop application with reproducible build inputs, isolated test data when requested, visible readiness or failure, useful diagnostics, and safe shutdown. A baseline is accepted only after the scenarios below pass on a recorded commit and environment.

The research document maps current configuration owners and conflicting definitions. Those conflicts must be reconciled before implementation relies on a supposed single source of truth. This plan does not silently change existing service policy, product onboarding, or architecture.

## Proposed acceptance checklist

All rows are pending. Record PASS, FAIL, or BLOCKED, command/scenario, commit, tool versions, effective profile/features, elapsed time, and evidence location. A skipped mandatory check blocks acceptance.

| ID | Scenario | Required evidence |
| --- | --- | --- |
| A01 | Prerequisites | Pinned toolchain resolves from a fresh shell; native tools and desktop dependencies are usable. Missing prerequisites fail before process or data mutation. |
| A02 | Reproducible install | Approved lockfile installation succeeds without dependency updates; effective package versions and native tools are recorded. |
| A03 | Code and native build | Launcher and desktop crate checks pass; Svelte check passes; desktop executable links. Lint changed code and run focused lifecycle tests. |
| A04 | Fresh profile | New isolated data directory initializes successfully; required services are healthy; main window and setup state are visible and accurate. Normal developer data is untouched. |
| A05 | Existing profile | A second launch reads the same saved preference or test record, without reseeding duplicates or repeating completed setup. |
| A06 | Model availability | Missing models produce an explicit setup state. The separately approved functional model test loads an assigned model and completes a real request; an assignment alone is not a pass. |
| A07 | Configuration agreement | Launcher, frontend, desktop, and engine agree on addresses, selected profile, and features. Invalid overrides and incompatible settings fail clearly. |
| A08 | Port and build conflicts | Occupied ports and concurrent builds produce actionable status without terminating unrelated processes. Second desktop launch has a defined outcome. |
| A09 | Critical failure | Injected required-service failure or boot timeout produces a visible diagnostic and a defined failure result in both debug and packaged builds. No hidden indefinite wait or false-ready state. |
| A10 | Optional capability failure | Behavior matches the approved failure policy; UI, health, logs, and exit outcome agree. Disabled features are explicitly distinguishable from failed ones. |
| A11 | Event timing | Early boot completion, late frontend mount, reload, and remount converge on current platform and model state without duplicate listeners or missed terminal state. |
| A12 | Normal shutdown | Window close and launcher Ctrl+C have defined behavior; owned tasks and children stop; final logs flush; ports and database locks release within the agreed deadline. |
| A13 | Interrupted startup/runtime | Terminate only the test session during boot and after an acknowledged write. Restart succeeds, acknowledged data meets the storage durability contract, and existing user data is untouched. |
| A14 | Hot reload | Frontend edit refreshes successfully; Rust rebuild/restart does not leave stale processes, duplicate listeners, or locked data. |
| A15 | Debugging | Frontend DevTools and a Rust breakpoint both work through a documented workflow using the intended build inputs and data profile. |
| A16 | Packaged build | Launch the packaged application without the frontend development process. Verify assets, required native libraries, data location, failure visibility, persistence, and shutdown. |

## STOP — Owner decision required before implementation

**Question:** What must the first accepted baseline include?

- **Option A — Platform baseline first (recommended):** desktop shell, required storage, IPC, setup UI, persistence, and shutdown. Model execution is a subsequent functional acceptance gate. This still runs the real application and must not fabricate healthy states.
- **Option B — Platform plus local model execution:** all of A plus a selected local model and a real request before baseline acceptance. Requires agreement on model files, available hardware, and download/setup prerequisites.
- **Option C — Full development environment:** all of B plus the embedded editor and any explicitly named auxiliary application. Larger prerequisite and lifecycle scope.

**Impact:** Determines mandatory capabilities, test fixtures, and acceptance scope. Do not disable currently enabled services simply to achieve Option A. Any service policy change is reviewed explicitly.

## Conditional work packages

These are proposed sequencing and exit criteria, not approved implementation steps. Stop at the decision above before executing them. At each phase entry, list at most five exact files; split larger packages into separately reviewed phases. Re-read before and after edits and run the required scoped check after each edit.

### 1. Reproducible prerequisites

- [ ] Inventory effective Rust, Node, pnpm, compiler/linker, SDK, WebView2, and native dependency inputs.
- [ ] Establish authoritative workspace install/lockfile behavior; repair the current dependency tree without updating versions as a side effect.
- [ ] Make preflight validate usable tools and actionable failures, not just directory presence.
- [ ] Resolve the CRT declaration conflict using actual dependency/link requirements.
- [ ] Exit: prerequisite checks and scoped launcher check pass; desktop build blockers are concrete and recorded.

### 2. Safe launcher and matching verification

- [ ] Remove implicit termination by executable name or occupied port from normal startup.
- [ ] Define session ownership, containment failures, concurrent launch, and cancellation behavior.
- [ ] Use identical resolved native environment and intended desktop feature selection for checks and launch.
- [ ] Keep complete failure output, return correct status, and clean up an already-started checker if another cannot start.
- [ ] Exit: ownership/conflict tests pass; frontend and desktop checks run through the supported workflow.

### 3. Effective configuration and test data

- [ ] Review configuration precedence and whether existing runtime overrides apply to development addresses.
- [ ] Consolidate conflicting configuration responsibility without introducing runtime dependencies into the launcher unnecessarily.
- [ ] Add explicit selection of a fresh test data directory, controlled seeding, and safe reuse.
- [ ] Record sanitized effective configuration and dependency versions per session.
- [ ] Exit: alternate-profile and invalid-configuration tests pass without touching normal developer data.

### 4. Readiness and failure behavior

- [ ] Owner approves whether optional enabled-service failures allow degraded operation or block startup.
- [ ] Owner approves visible failure behavior and consistency between debug and release.
- [ ] Reconcile boot validation, health evaluation, state publication order, and model setup readiness.
- [ ] Close snapshot/listener timing gaps and test late mounting.
- [ ] Exit: success, required failure, optional failure, timeout, and reload scenarios agree across UI and backend.

### 5. Shutdown, recovery, and diagnostics

- [ ] Inventory all background tasks, listeners, file writers, and owned child processes.
- [ ] Define and test a bounded graceful shutdown, including the sidecar; reserve forced termination for owned processes after the bound.
- [ ] Retain final errors and flush logs; correlate launcher and application sessions.
- [ ] Verify persistence and interrupted-run recovery using isolated fixtures.
- [ ] Exit: repeated launch/close/restart and crash-recovery scenarios pass with retained evidence.

### 6. Baseline qualification and maintenance

- [ ] Run the entire approved acceptance matrix, including native debug and packaged smoke tests.
- [ ] Record initial timings before setting regression thresholds; do not invent a performance target.
- [ ] Write a short runbook: prerequisites, install, check, run, debug, logs, stop, and recovery.
- [ ] Add focused automation for configuration disagreement, unsafe cleanup, false readiness, event timing, and persistence regressions.
- [ ] Record the qualifying commit, lockfile hashes, environment, known limitations, and test evidence. Owner approves baseline qualification; publishing/tagging is a separate action.

## Phase-zero verification and limits

This phase creates only the linked research document and this plan. `cargo check -p xtask --locked` is run after each document edit to comply with repository rules. It verifies the existing launcher still checks; it does not verify the application or validate this plan's architecture. No dependencies, runtime data, or application source are changed.

No baseline is declared until the approved acceptance matrix passes. Review this plan and select the initial capability scope before the first implementation phase.
