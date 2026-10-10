# SPRINT: Phase 0e — Human Worklog

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY
> **Scope**: **XS** — 2 files, docs + folder scaffold.
> **Prerequisite**: None.
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

AI memory (`MEMORY.md`) serves the assistant's recall across conversations. The owner needs a **separate, human-facing, append-only log** capturing what happened each session: what was tried, what broke, what was learned.

This survives context compaction. Survives new conversations. Survives the AI forgetting.

Protocol: one file per day. Three-bullet template. 30 seconds at end of session. No exceptions.

---

## Why (concrete rationale)

- 16 days of little progress + 2 days app-won't-boot → the owner has been context-switching at high cost.
- AI `MEMORY.md` is >200 lines and got truncated on load — not fully reliable for session-to-session recall.
- Git commit messages capture WHAT shipped, not WHY or WHAT BROKE.
- The pro pattern: a 30-second daily note. Next session, you read yesterday's three bullets and resume in seconds.

## SSOT Map

| File | Current state | Phase 0e action |
|---|---|---|
| NEW `scripts/docs/worklog/README.md` | — | Protocol doc + template + example. |
| NEW `scripts/docs/worklog/2026-04-20.md` | — | Today's entry — seeded with what this sprint session actually accomplished. |
| `scripts/docs/VERIFICATION.md` (from Phase 0d) | — | Links to worklog/README.md under §6. |

## Duplication Scan

- No `scripts/docs/worklog/` folder exists (`ls scripts/docs/` confirms).
- No owner-facing daily log elsewhere in repo.
- `MEMORY.md` stays reserved for AI auto-memory — different audience, different lifetime.
- Git commit messages = per-commit, not per-session — complementary, not competing.

## Files (2)

### File 1: `scripts/docs/worklog/README.md`

```markdown
# Worklog

> Append-only. One file per day. Three bullets. End of session. No more, no less.

## Why

AI memory is for the assistant. This is for you. When you come back tomorrow,
next week, or after a context reset, the last few worklog entries tell you
where you were and why.

## Protocol

- File name: `YYYY-MM-DD.md` (one per calendar day, your local time).
- Three bullets (max):
  - **Worked on** — one line, what you focused on.
  - **Broke / blocked by** — one line, what bit you today (link to commit, file, sprint).
  - **Learned / saved to memory** — one line, what stuck (link to `.claude/mistakes.md` if added).
- 30 seconds at end of session. Not a journal. Not an essay.
- Append-only. If you learned something at 11pm that updates the morning entry,
  add a fourth bullet `**Evening update**`. Don't rewrite.

## Template

Copy-paste, fill in:

    # YYYY-MM-DD

    - **Worked on:**
    - **Broke / blocked by:**
    - **Learned / saved to memory:**

## Example

    # 2026-04-20

    - **Worked on:** Phase 0a (#[instrument]) + Phase 0b (anyhow::Context on profile.rs + cloud/mod.rs).
    - **Broke / blocked by:** Realized ConfigView 5th tab would duplicate /devtools/claude — pivoted Phase B.
    - **Learned / saved to memory:** Always grep for /devtools/<name> before authoring a new control surface. Added to `.claude/mistakes.md`.

## When NOT to write

- Mid-session rambling (use a scratch file).
- Planning next week (use sprint docs).
- Commit messages (use git).

## Linking to other memory

- If today's learning is AI-relevant → add to `.claude/mistakes.md` AND link here.
- If it's an architecture decision → add to `ADR.md` AND link here.
- The worklog is an index, not the canonical source.
```

### File 2: `scripts/docs/worklog/2026-04-20.md`

```markdown
# 2026-04-20

- **Worked on:** Planning `SPRINT-WIZARD-FINISH` with decision gates (9 STOPs). Phase 0a (`#[instrument]` on engine boot + persistence + model_loader) landed green. Phase 0b migrated `profile.rs` + `cloud/mod.rs` to `anyhow::Context` boundary pattern. Research swept `/devtools/claude`, `/devtools/sts`, `/devtools/models` to map duplication surface.
- **Broke / blocked by:** Phase B original plan (`RoutingModeRadio` on wizard ConfigView 5th tab) would have duplicated `/devtools/claude` page. Pivoted to "Default Brain card on `/devtools/claude` Subscription tab with auto-fallback routing (Subscription default → LocalFirst when local brain applied)." Also: app won't boot for 2 days — observability work IS the diagnostic.
- **Learned / saved to memory:** Before authoring a new control surface, grep `routes/(devtools)/devtools/<name>/+page.svelte` and read the engine-side config module (`systems/devpulse-engine/src/claude/mod.rs`) for SSOT. Anthropic's `cloud_chat` is the only wired provider — OpenAI/Gemini cards in `/devtools/claude` are display-only. MCP/sidecar/Claude-Code probes are NOT authored yet.
```

## Execution Order

1. `mkdir scripts/docs/worklog` (implicit via first file write).
2. Write README.md.
3. Write 2026-04-20.md as seed.
4. Commit: `docs: worklog protocol + seed (Phase 0e)`.

## Verification Gate

- [ ] `ls scripts/docs/worklog/` returns README.md + 2026-04-20.md.
- [ ] VERIFICATION.md §6 (Phase 0d) links to `worklog/README.md`.
- [ ] Template in README is copy-paste-valid Markdown.

## Do NOT Touch

- `MEMORY.md` — stays AI-owned.
- `.claude/mistakes.md` — Phase 0e links to it but doesn't edit it.
- Git workflow — worklog is parallel, not a replacement.
- `ADR.md` — parallel, not a replacement.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Worklog becomes a dumping ground | Three-bullet rule. Hard cap. If you need more, write a sprint doc or add to `.claude/mistakes.md`. |
| Skipping days | Expected — miss a day, miss a day. No guilt. Resume tomorrow. |
| Rewriting past entries | Append-only rule. Changes go in an "Evening update" bullet. |
| Duplicating AI memory | Worklog is human-facing. MEMORY.md is AI-facing. Different audience. |

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Referenced by: `scripts/docs/VERIFICATION.md` §6 (Phase 0d)
- Complementary: `.claude/mistakes.md`, `ADR.md`
