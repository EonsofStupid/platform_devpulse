# SPRINT: Phase 0d — `VERIFICATION.md` Cookbook

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY
> **Scope**: **XS** — 1 file, docs only.
> **Prerequisite**: Phase 0a + 0b (so references are real).
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

Single owner-facing reference card for the entire verification + observability stack. Copy-pasteable commands. Covers:

1. 4-pane dev loop (what to keep running while coding).
2. `jq` cookbook for session JSONL.
3. `cargo xtask verify` (from Phase C once it lands).
4. `tokio-console` (from Phase 0c).
5. Environment variables (`RUST_LOG`, `RUSTFLAGS`, `DEVPULSE_LOG_LEVEL`).
6. Worklog protocol (Phase 0e).
7. Lefthook — how to run it manually.

No tool changes. No code changes. Just docs that unblock every future debugging session.

---

## SSOT Map

| File | Current state | Phase 0d action |
|---|---|---|
| NEW `scripts/docs/VERIFICATION.md` | Does not exist | Create with 7 sections (see §Content below). |
| `CLAUDE.md` | Already references verification commands scattered | Add one-line link to VERIFICATION.md in the "Commands" section. |
| `scripts/docs/TOKIO-CONSOLE.md` (from Phase 0c) | — | VERIFICATION.md links to it. |

## Duplication Scan

- No existing `VERIFICATION.md` in the repo (`ls scripts/docs/` confirms).
- No overlapping doc covers the 4-pane dev loop OR the jq cookbook.
- `CLAUDE.md` lists commands but doesn't document the observability stack.
- MASTER-PLAN.md covers ColdLight — separate concern.

## Files (1 file + 1 link)

1. NEW `scripts/docs/VERIFICATION.md` — full content below.
2. EDIT `CLAUDE.md` — add `- Verification + observability: @scripts/docs/VERIFICATION.md` under `## Commands`.

## Content blueprint for VERIFICATION.md

```markdown
# DevPulse Verification + Observability

> Read this before every debugging session.
> Updated after major observability changes (Phase 0 and beyond).

## 1. The 4-pane dev loop

Keep these four terminals open while coding:

| Pane | Command | Signal |
|---|---|---|
| 1 | `cargo watch -x 'check -p devpulse_desktop_backend'` | Rust compile errors the moment you save a .rs file |
| 2 | `cd interfaces/desktop && pnpm check --watch` | Svelte/TS errors the moment you save a .svelte/.ts file |
| 3 | `tail -F {data_dir}/logs/session-*.jsonl \| jq -c 'select(.level==\"ERROR\" or .level==\"WARN\")'` | Runtime errors as they happen, filtered |
| 4 | `tokio-console` (requires Phase 0c feature enabled) | Async task graph |

Install once:
    cargo install cargo-watch tokio-console
    winget install jqlang.jq   # or `choco install jq`

## 2. jq cookbook for session JSONL

Session JSONL lives at `{data_dir}/logs/session-YYYY-MM-DD-HHMMSS.jsonl`.
Each line is one tracing event or span.

Last 5 errors:
    tail -n 500 session-*.jsonl | jq -c 'select(.level==\"ERROR\")' | tail -5

All spans with name containing \"boot\":
    jq -c 'select(.span.name \| test(\"boot\"))' session-*.jsonl

Spans slower than 1 second (elapsed in microseconds):
    jq -c 'select(.elapsed_us? and .elapsed_us > 1000000)' session-*.jsonl

Model loader timing:
    jq -c 'select(.target==\"devpulse_clyffy::model_loader\")' session-*.jsonl

Everything about slot \"chat.brain\":
    jq -c 'select((.fields.slot_id // .span.fields.slot_id) == \"chat.brain\")' session-*.jsonl

## 3. cargo xtask verify (Phase C)

One command, all gates:
    cargo xtask verify

Runs: fmt-check, clippy (-D warnings), cargo test --lib, svelte-check, biome, pnpm test:run, check:ipc.
Target: <30s incremental.

## 4. tokio-console (Phase 0c)

See @scripts/docs/TOKIO-CONSOLE.md.

## 5. Environment variables

| Var | Default | Effect |
|---|---|---|
| `RUST_LOG` | `info,devpulse=debug` | Per-module log level filter. `debug`, `trace` supported. |
| `RUSTFLAGS` | — | Set `--cfg tokio_unstable` for Phase 0c. |
| `DEVPULSE_LOG_LEVEL` | (engine reads this) | Aliased form for `RUST_LOG`. |
| `ANTHROPIC_API_KEY` | — | Piggyback off Claude Code session for `cloud_chat`. |

## 6. Worklog protocol

See @scripts/docs/worklog/README.md.

End of every session, write 3 bullets in today's file:
- What you worked on.
- What broke.
- What you learned (store in .claude/mistakes.md if repeating).

## 7. Lefthook

Pre-commit gates (11 hooks):
    lefthook run pre-commit

Pre-push gates (3 hooks):
    lefthook run pre-push

Single hook:
    lefthook run pre-commit --commands rust-fmt

## 8. Common failure modes

| Symptom | Root cause to check first |
|---|---|
| App hangs on boot | `tokio-console` → find blocked tasks. Check `boot_task` span timing. |
| \"Failed to query profiles\" on frontend | Pre-Phase 0b error. Re-check if migration is complete. Look at session JSONL span with `err` field. |
| SurrealDB won't open | `{data_dir}/surreal/` path with Windows backslashes. Check surreal.rs URI scheme. |
| Model scan stuck | `#[instrument]` span on `scan_models` should show duration. `>60s` = broken. |
```

## Execution Order

1. Write VERIFICATION.md with the content above.
2. Edit CLAUDE.md to add the link.
3. Dry-run every command in the doc on Windows PowerShell — confirm they work. Fix any Windows-specific syntax.
4. Commit: `docs: VERIFICATION.md cookbook (Phase 0d)`.

## Verification Gate

- [ ] VERIFICATION.md exists at `scripts/docs/VERIFICATION.md`.
- [ ] Every command in §1, §2, §3, §7 is copy-pasted into a shell and runs (or fails for an expected reason like \"no session log exists yet\").
- [ ] `CLAUDE.md` links to it.
- [ ] No broken file references.

## Do NOT Touch

- Lefthook config itself — just document how to invoke it.
- Existing logging.rs — referenced, not changed.
- xtask subcommands — Phase C authors `verify`.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Writing doc that drifts from reality | Every command must be executed before commit. |
| Documenting tools you haven't installed | If `jq` is not installed on the owner's box, Phase 0d includes the install command, not a `TODO`. |
| Duplicating CLAUDE.md rules | VERIFICATION.md covers workflow; CLAUDE.md covers policy. One link, no overlap. |

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Prerequisite docs: `scripts/docs/TOKIO-CONSOLE.md` (Phase 0c)
- Phase A + B + C reference VERIFICATION.md for their own gates.
