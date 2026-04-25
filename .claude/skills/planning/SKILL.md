---
name: planning
description: Methodical planning workflow that enforces a read→note→research→note→read-code→note→research-online→note loop before synthesis. Refuses to write the final plan until every research phase has produced cited findings on disk. Use when the task is non-trivial, spans multiple files, or has unclear constraints. Skip for one-line edits.
model: opus
temperature: 0
tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash
  - WebSearch
  - WebFetch
  - AskUserQuestion
  - TodoWrite
arguments:
  - name: goal
    description: One-line statement of what is being planned. Required.
---

# Planning — Methodical, Note-Driven, Citation-Bound

You were invoked because the user wants a real plan, not a vibe. The
goal is `$goal`. A plan that is not grounded in code reads + external
research + adversarial review is worse than no plan — it lies with
confidence. Your job is to refuse that failure mode by writing notes
to disk between every research step, citing every claim, and
synthesizing only after the scratchpad is full.

You will produce ONE artifact: a markdown plan file in
`~/.claude/plans/<slug>.md`. The conversation is the *workshop*; the
file is the *deliverable*. If the file is shallow, the work was shallow.

## Bail-out clause (read first)

If `$goal` describes a one-sentence diff (rename, single-file typo
fix, remove a dead import, bump a version number, add a single log
line), **stop and tell the user**: *"This is a one-shot edit, not a
planning task. I'll just do it."* Then exit the skill. Anthropic's
own guidance: *"if you could describe the diff in one sentence, skip
the plan."* Over-planning trivial work is its own failure mode.

If `$goal` is genuinely ambiguous in scope ("clean up the kernel"),
do not infer scope — ask one tight clarifying question and wait.

## Phase 0 — Set up the scratchpad

1. Pick a slug: three-word kebab style matching existing plans
   (e.g. `drifting-stirring-mist`, `nested-dazzling-conway`). Use
   `Bash` `ls ~/.claude/plans/` to see neighbors and avoid collisions.
2. Read `${CLAUDE_SKILL_DIR}/references/template.md`.
3. Write its contents to `~/.claude/plans/<slug>.md`, replacing the
   `<task title>` and `target` placeholders with `$goal`. Set
   `status: research`.
4. Tell the user the slug and path in one line. They will reference
   it later.

## The phase loop — read, note, research, note

You will pass through phases 1–7. Each phase has a **work step** and a
**note step**. **You may not advance to the next phase's work step
until the prior phase's note step has written to disk.** This is not
a suggestion. The whole point of this skill is that you write between
research, not just after.

After every note step, re-read the scratchpad before continuing.
Working memory drifts; the file is ground truth.

### Phase 1 — Intake

- **Work:** Re-read the user's verbatim ask. If anything is
  ambiguous (target file, scope boundaries, success criteria), use
  `AskUserQuestion` to extract ≥3 clarifying answers. Do not ask
  obvious questions; dig into the parts they may not have considered.
- **Note:** Write the verbatim ask + Q/A pairs into §1 of the
  scratchpad. Number the questions Q1, Q2, Q3 — these IDs will be
  cited in §8.

### Phase 2 — Surrounding code map

- **Work:** Use `Glob` and `Grep` to identify files relevant to
  `$goal`. Aim for ≤15 paths. Do **not** Read them yet — this phase
  is the map, not the territory.
- **Note:** Write each path into §2 with a one-line summary of what
  it is (inferred from filename + a single grep hit). If you Read a
  file in this phase, you are doing Phase 3 prematurely. Stop.

### Phase 3 — Detailed reads

- **Work:** Read the files that matter. Large files (>500 LOC)
  must use `offset`/`limit` and you must explicitly note "partial
  read, lines X–Y" in your findings. Per project rule CC-004, never
  assume one Read returned the whole file.
- **Note:** For each file, write into §3:
  - `path:line-range` of what you read
  - 2–4 finding bullets, each with a `path:line` citation
  - If the file contradicts the user's premise, flag it explicitly
    with `⚠ contradicts ask:`
- **Forbidden:** restating filenames as "findings." A finding is a
  fact the reader couldn't get from the path alone.

### Phase 4 — External research

- **Work:** Use `WebSearch` and `WebFetch` to look up libraries,
  APIs, prior art, or patterns referenced in the code or required by
  the plan. Skip if `$goal` is purely internal refactoring with no
  external surface.
- **Note:** Write each URL into §4 with:
  - 2-line takeaway
  - `[official]` (vendor docs, RFCs, project README), `[blog]`
    (Medium, Substack, personal posts), or `[inferred]` (your gloss)
  - Date if visible — sources older than 18 months for fast-moving
    libs are suspect; flag them.

### Phase 5 — Constraints discovered

- **Work:** Re-read §1, §3, §4. List every constraint surfaced —
  technical (API limits, type signatures, build flags), procedural
  (test gates, CI rules), or stated by the user.
- **Note:** Write into §5. Crucially, this section MUST include a
  subsection `### Contradictions to the ask` listing anything found
  that pushes back on what the user requested. If you find none,
  write `none found` and add a one-sentence justification of why you
  looked. Empty-with-no-justification is the sycophancy failure mode
  and is forbidden.

### Phase 6 — Open questions

- **Work:** Triage Phase-1 questions plus any new ones from Phases
  3–5. For each: resolved (with citation), or explicitly deferred
  (with reason).
- **Note:** Write into §6. Every Q-ID must reach a terminal state.

### Phase 7 — Pre-mortem / risks

- **Work:** Adversarial pass. Imagine the plan ships and breaks.
  What broke and why? List ≥3 distinct risks. Steel-man the
  alternative approach you're not picking — what would its advocate
  say?
- **Note:** Write into §7. Fewer than 3 distinct risks = phase
  incomplete; go back.

## Synthesis gate — read the checklist

Before writing §8, Read `${CLAUDE_SKILL_DIR}/references/checklist.md`
and verify your scratchpad against it line by line. If any check
fails, you go back to the relevant phase and finish it. Do not paper
over a gap.

## Phase 8 — The plan

- **Work:** Re-read the *primary target file* (per CC-006: stale
  context kills plans — refresh before synthesis).
- **Note:** Write §8 as numbered steps. **Every step must cite
  either a Q-ID from §1/§6 or a finding from §3/§4 or a constraint
  from §5.** Steps that do not cite are unsupported and must be
  deleted or sourced.

## Phase 9 — Verification

- **Note:** Write into §9 the concrete verification commands and
  signals that confirm success. For DevPulse this is typically
  `cargo check -p <crate>` (per crate, never workspace-wide), `pnpm
  check` in `interfaces/desktop/`, and a runtime check (`cargo xtask
  run-dev` + the specific UI path or log line to look for). Compile
  green ≠ product works — the verification step must include a
  runtime signal, not just typecheck.

## Close out

- Set `status: ready` and write `STATUS: complete` at the bottom of
  the scratchpad.
- Tell the user, in one line, the path and the headline of the plan.
  Do not paste the plan into chat — it lives in the file.
- If the user accepts, the next session reads the file as input.
  This is the SPEC.md → restart pattern. The scratchpad is durable;
  the conversation is not.
- **Do not call `EnterPlanMode`.** This skill replaces it. The file
  on disk *is* the plan. Calling the panel tool here would split the
  artifact across two surfaces and defeat the whole restart pattern.

## Failure modes this skill explicitly designs against

| Failure | Defense |
|---|---|
| Premature synthesis | §8 is gated on the checklist; every step cites a finding |
| Note-collapse (restating the prompt) | Findings require `path:line` or URL citations |
| Sycophantic plan | §5 must list contradictions or justify "none" |
| Stale context drift | Re-read primary target file immediately before §8 |
| Over-planning trivial work | Bail-out clause at the top |
| Polluted plan with raw file dumps | §3 captures findings, not file contents |
| Phantom dependencies | §4 tags `[official]/[blog]/[inferred]`; blogs ≠ docs |

## Examples

- A quality plan: `${CLAUDE_SKILL_DIR}/examples/good.md`
- An anti-pattern plan: `${CLAUDE_SKILL_DIR}/examples/lazy.md`

If you find yourself producing something closer to `lazy.md` than
`good.md`, stop and finish the missing notes before continuing.
