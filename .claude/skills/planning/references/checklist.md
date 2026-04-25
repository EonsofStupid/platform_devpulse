# Synthesis Gate — Pre-§8 Self-Check

Read this list before writing §8. Verify each line against your
scratchpad. If any line fails, go back to the relevant phase and
finish it. Do not paper over.

## Intake (§1)

- [ ] Verbatim user ask is captured (not paraphrased)
- [ ] ≥3 clarifying Q/A pairs, numbered Q1, Q2, Q3, ...
- [ ] No "obvious" questions — each Q digs into something the user
      may not have considered

## Code map (§2)

- [ ] ≤15 paths, each with a one-line summary
- [ ] No file content was Read in this phase (would be Phase 3)

## Detailed reads (§3)

- [ ] Every finding has a `path:line` citation
- [ ] Files >500 LOC are explicitly marked "partial read, lines X–Y"
      (per CC-004)
- [ ] No findings that just restate the file's name or top-of-file
      doc comment
- [ ] Any file contradicting the ask is flagged with `⚠ contradicts
      ask:`

## External research (§4)

- [ ] Every URL has a 2-line takeaway
- [ ] Every URL is tagged `[official] | [blog] | [inferred]`
- [ ] Sources older than 18 months for fast-moving libraries are
      flagged
- [ ] OR: §4 is empty AND `$goal` is a pure internal refactor with no
      external surface

## Constraints (§5)

- [ ] Technical and procedural constraints surfaced from §1, §3, §4
- [ ] `### Contradictions to the ask` subsection exists
- [ ] Subsection lists ≥1 contradiction OR contains `none found —
      <justification>` (sycophancy guard)

## Open questions (§6)

- [ ] Every Q-ID reaches a terminal state: `resolved:` or `deferred:`
- [ ] Resolved questions cite a source (`path:line` or URL)

## Pre-mortem (§7)

- [ ] ≥3 distinct risks
- [ ] Each risk has a mitigation
- [ ] Steel-man of the not-chosen alternative is present

## Pre-synthesis re-read

- [ ] The primary target file was Read **immediately before** drafting
      §8 (per CC-006 — stale context kills plans)
- [ ] If the file changed since Phase 3, §3 was updated to reflect it

## Plan integrity (§8 — verify *after* drafting)

- [ ] Every step cites at least one of: Q-ID (§1/§6), finding (§3),
      external source (§4), constraint (§5)
- [ ] No step relies on `[inferred]` alone — speculation must be
      called out as such
- [ ] Steps are ordered — early steps don't depend on later steps
- [ ] Verification (§9) includes a runtime signal, not just typecheck

## Final close-out

- [ ] `status:` set to `ready`
- [ ] `STATUS: complete` written at the bottom
- [ ] User informed of the path + headline (one line, no plan paste)

If every box is checked, the plan is ready to hand off. If any box
is unchecked and you cannot fix it, set `status: blocked` and write
the blocking reason inside `STATUS:`. A blocked plan is honest; a
faked plan is not.
