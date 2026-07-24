# R1 — scan-signal backend: finish, verify, commit

## GOAL

Land the per-probe `CandidateProbed` discovery event (already edited on disk,
never verified) so every scan attempt emits its structured signal — tracing
target + typed event, 1:1 — and the frontend can render ONLY attempts that
truly happened.

## PRECONDITIONS

1. `git status --porcelain` shows EXACTLY two modified files:
   `.claude/plans/coldlight-recovery/06-wizard-render-plan.md` and
   `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` (plus the
   untracked `08-wizard-recode-slices/` plan folder). Anything else → STOP.
2. Probe (expect a hit at ~line 80):
   `grep -n "CandidateProbed" interfaces/desktop/src-tauri/src/endpoint_discovery.rs`
   Expected: the enum variant `CandidateProbed { url, source, reached }` after
   `SourceScanned`, and one emission site inside the probe fan-out closure
   (near `buffer_unordered`, ~line 340-370) with
   `tracing::debug!(target: "clyffy.discovery", ...)` beside it.
   Zero hits → STOP (the edits were reverted; report, do not re-author blind).

## FILES

1. `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` — already edited
   (enum variant + per-probe emission). This slice VERIFIES it; edit only if
   the compiler rejects it.
2. `interfaces/desktop/src/lib/sys/generated/bindings.ts` — REGENERATED
   artifact (never hand-edited).

## STEPS

1. Read `endpoint_discovery.rs` in full (>500 LOC — chunked reads). Confirm
   the enum + emission match the PRECONDITION probe. Confirm `DiscoverySource`
   derives whatever the other event-embedded types derive (it is embedded in
   `CandidateProbed` — it must be `Clone + Serialize + specta::Type` like
   `DiscoveryEvent` requires; read the derive list on both).
2. `cargo check -p devpulse_desktop_backend` (crate name has underscores).
   Expected: exit 0, zero warnings. Any error → fix THE ERROR in this file
   only (typical: missing `Clone` on `DiscoverySource`, move-into-closure
   issues). Any warning → fix it for real, never `#[allow]`.
3. `cargo xtask regen-bindings` — regenerates `bindings.ts` so
   `clyffyDiscoveryProgress`'s payload union gains the `candidateProbed`
   variant (serde camelCase).
4. Probe the regen:
   `grep -n "candidateProbed" interfaces/desktop/src/lib/sys/generated/bindings.ts`
   Expected ≥1 hit carrying `url`, `source`, `reached` fields.
5. `cd interfaces/desktop && pnpm check` — expected 0 errors 0 warnings (the
   new union variant is additive; the existing listener matches on
   `e.kind === "found"` only and stays valid).
6. Commit (subject <100 chars) + push:
   `fix(desktop): per-probe discovery signal — CandidateProbed event + tracing, no-mock scan telemetry`
   Body: raw verify lines (cargo check, pnpm check). Include the two plan
   docs (`06-…md` update + the whole `08-wizard-recode-slices/` folder) in
   THIS commit so the tree is clean after R1.

## IMPORT REPOINTS

None — additive enum variant; no consumer changes in this slice.

## VERIFY

- `cargo check -p devpulse_desktop_backend` → exit 0, 0 warnings
- `grep -c "candidateProbed" interfaces/desktop/src/lib/sys/generated/bindings.ts` → ≥1
- `cd interfaces/desktop && pnpm check` → 0/0
- `git status --porcelain` after commit → empty

## KNOWN REDS

None expected in this crate. The 106 vitest / Sheet / Checkbox reds are
frontend-side and untouched here.

## ROLLBACK

`git checkout -- interfaces/desktop/src-tauri/src/endpoint_discovery.rs` and
re-run `cargo xtask regen-bindings` to restore bindings. (Only on operator's
word — the edits are the slice's whole content.)

## STOP CONDITIONS

- Precondition probe fails (edits absent) → STOP, report.
- `cargo check` reveals errors outside `endpoint_discovery.rs` → STOP (tree
  drifted; do not fix other files).
- Bindings regen touches files other than generated ones → STOP, report list.
