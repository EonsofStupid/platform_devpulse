# <task title>

```yaml
status: research   # research | synthesizing | ready | abandoned
target: <one-line description of what is being planned>
slug: <three-word-kebab>
opened: <YYYY-MM-DD>
```

## 1. Intake

**Verbatim user ask:**

> <copy the user's request word-for-word>

**Clarifying Q&A** (≥3, numbered for citation):

- **Q1:** <question>
  - **A1:** <user's answer>
- **Q2:** ...
- **Q3:** ...

## 2. Surrounding code map

≤15 files relevant to the goal, identified via Glob/Grep. One line
each. No detailed reads yet — this is the map, not the territory.

- `path/to/file.rs` — <one-line role inferred from name + grep hit>
- `path/to/other.svelte` — ...

## 3. Detailed reads

Per file: what was read, what was found, with citations.

### `path/to/file.rs:1-120` (full read)

- <finding>  — `path/to/file.rs:42`
- <finding>  — `path/to/file.rs:88`
- ⚠ contradicts ask: <if anything in the file pushes back on the request>

### `path/to/large_file.rs:200-450` (partial read)

- ...

## 4. External research

URL → 2-line takeaway. Tag every source.

- <https://example.com/page> [official] — <takeaway line 1>
  <takeaway line 2>
- <https://blog.example.com/post> [blog, 2024-09] — ...
- (none) [inferred] — <gloss the planner is making without a source>

## 5. Constraints discovered

Technical, procedural, and stated constraints surfaced by Phases 1, 3,
and 4.

- <constraint with citation>
- <constraint with citation>

### Contradictions to the ask

What the research found that pushes back on the user's request. If
nothing, write `none found` and justify in one sentence.

- ⚠ <contradiction>  — `path:line` or URL
- (or) `none found — <one-sentence justification of why we looked>`

## 6. Open questions

Every Q-ID from §1 plus anything new from §3–§5. Each in a terminal
state: resolved or explicitly deferred.

- **Q1:** <question> — **resolved:** <answer> (`path:line` or URL)
- **Q4:** <new question> — **deferred:** <why it can wait>

## 7. Risks / pre-mortem

≥3 distinct risks. Steel-man the alternative approach not chosen.

- **Risk 1:** <how the plan breaks in production> — **mitigation:** ...
- **Risk 2:** ...
- **Risk 3:** ...
- **Steel-man (alternative not chosen):** <what its advocate would say>

## 8. Plan

Numbered steps. Every step cites a Q-ID, finding, or constraint.

1. <step>  — cites: §3 `path:line`, Q2
2. <step>  — cites: §5 contradictions, §4 [official]
3. ...

## 9. Verification

How we will know it worked. Compile-green ≠ product-works — include a
runtime signal.

- `cargo check -p <crate>` — typecheck (per crate, not workspace)
- `pnpm check` in `interfaces/desktop/` — Svelte check
- Runtime: `cargo xtask run-dev` + <specific UI path or log line>

---

STATUS: <complete | blocked: reason>
