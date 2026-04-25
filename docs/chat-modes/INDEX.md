# Chat Modes — DevPulse

> Two halves: **recognition** (the user at their best — execute on the spec they wrote) and **discipline** (corrective patterns the user has had to repeat). One crosscutting overlay: **burnout mode**.
>
> Distilled from 2,304 cleaned user prompts across 44 sessions in the 14-day window 2026-04-11 → 2026-04-25. Every trigger phrase below has a measured document-frequency from the corpus — fabricated triggers have been removed.

## How this was built

1. **Raw extraction** — [`_raw/extract-prompts.js`](_raw/extract-prompts.js) streamed all `.jsonl` transcripts, kept only user-typed text, stripped rage / abuse / auto-injected blocks (`<ide_opened_file>`, `<system-reminder>`, `<local-command-caveat>`, etc.) and trivial filler. Output: [`_raw/all-prompts.txt`](_raw/all-prompts.txt) (2,034 prompts; 270 more recovered after a second extractor pass).
2. **Frequency pass** — [`_raw/freq.js`](_raw/freq.js) produced [`_raw/freq.json`](_raw/freq.json) — top n-grams as cluster anchors.
3. **Two clustering passes:**
   - **Discipline pass** — [`_raw/themes.json`](_raw/themes.json), 13 corrective themes; refined down to **10 after merge** (paste-build folded into recognition diagnostic-paste; no-rushing-foundational folded into research-then-execute).
   - **Recognition pass** — [`_raw/recognition-themes.json`](_raw/recognition-themes.json), 8 patterns of the user authoring at their best.
4. **Validation** — [`_raw/audit.js`](_raw/audit.js) measured every claimed trigger against the corpus. 7 fabricated triggers (zero hits) were stripped from the discipline docs.
5. **Burnout overlay** — [`_raw/burnout-probe.js`](_raw/burnout-probe.js) confirmed burnout markers (`tired` 26, `wasted` 23, `useless` 28, `you keep` 10, `cant even` 12) cluster in short, shouty prompts; documented as the crosscutting mode that modifies all the others.

## Half A — Recognition modes (the user at their best)

These fire when the user has done the design work themselves. Execute on the spec verbatim; do NOT redesign, expand scope, or ask clarifying questions when the spec is already specific.

| Verified-trigger leader | Slug | Promote |
|---|---|---|
| `cargo check` (66) | [`recognition-diagnostic-paste-triage`](recognition-diagnostic-paste-triage.md) — pasted compiler output IS the prompt | skill |
| `SSOT` (55) / `\|---` (53) / `source of truth` (54) | [`recognition-ssot-comparison-table`](recognition-ssot-comparison-table.md) — markdown table is the contract | skill |
| `best practice` (49) / `right?` (7) / `am I wrong` (5) | [`recognition-fork-with-stated-hypothesis`](recognition-fork-with-stated-hypothesis.md) — yes/no decision with reasoning | none |
| `│` (49) / `└─` (41) / `┌` (17) | [`recognition-ascii-architecture-diagram`](recognition-ascii-architecture-diagram.md) — diagram is the design | skill |
| ` ```rust ` (44) / `pub struct` (39) | [`recognition-rust-shape-as-spec`](recognition-rust-shape-as-spec.md) — Rust types as contract | skill |
| `Phase 1` (35) / `Phase 2` (35) / `Phase 0` (26) | [`recognition-phased-execution-plan`](recognition-phased-execution-plan.md) — pre-authored plan, execute one per turn | skill |
| `deferred` (20) / `do not touch` (12) / `out of scope` (8) | [`recognition-frozen-surface`](recognition-frozen-surface.md) — file allowlist | skill |
| `## Verification` (14) / `Verification Gate` (7) | [`recognition-verification-checklist-close`](recognition-verification-checklist-close.md) — `[ ]` boxes are done | skill |

## Half B — Discipline modes (corrective patterns)

These are the things the user has had to repeat across sessions. Most map onto an existing memory entry; the chat-mode docs add trigger surface + automatic-action checklists that the underlying rule doesn't capture.

| Verified-trigger leader | Slug | Promote | Existing memory |
|---|---|---|---|
| `execute` (86), `DO IT NOW` (7) | [`direct-action-no-preamble-no-apology`](direct-action-no-preamble-no-apology.md) | skill | `feedback_execution_style.md` |
| `cargo check -p` (56), `verification gate` (34) | [`verify-runtime-not-just-compile`](verify-runtime-not-just-compile.md) | skill | `feedback_compile_green_not_enough.md` |
| `half ass` (53), `TODO` (26), `stub` (18) | [`no-stubs-no-half-finished-progress`](no-stubs-no-half-finished-progress.md) | skill | `feedback_no_stubs.md` |
| `SSOT` (88), `best practice` (49) | [`research-then-execute-no-loops`](research-then-execute-no-loops.md) — merged with `no-rushing-foundational` | skill | `feedback_research_then_execute.md` |
| `SSOT` (88), `regen-bindings` flow | [`single-source-of-truth-no-drift`](single-source-of-truth-no-drift.md) | skill | `feedback_ip_boundary_is_vocabulary_not_wrappers.md` |
| `Qwen` (49), `layman friendly` (32) | [`model-loader-ui-locked-stop-relitigating`](model-loader-ui-locked-stop-relitigating.md) | skill | `project_model_loader_requirements.md` |
| `ColdLight` (97), `oklch` (27) | [`design-system-discipline-tokens-not-hex`](design-system-discipline-tokens-not-hex.md) | skill | `feedback_token_tier_naming.md` |
| `rune` (55), `$state` (36) | [`honest-realtime-ui-state`](honest-realtime-ui-state.md) | skill | `project_devtool_pattern.md` |
| `missing documentation` (25), `clippy` (23) | [`all-warnings-non-fatal-included`](all-warnings-non-fatal-included.md) | skill | `feedback_all_warnings_addressed.md` |
| `APG` (14), `base component` (7) | [`wai-aria-apg-base-component-discipline`](wai-aria-apg-base-component-discipline.md) | skill | `feedback_design_system_direction.md` |
| `align` / `delete` / `pre-release` | [`no-backcompat-pre-release-aggressive-rewrite`](no-backcompat-pre-release-aggressive-rewrite.md) | none | `feedback_no_backcompat_questions.md` |

## The crosscutting overlay — burnout mode

[`burnout-mode-crosscutting`](burnout-mode-crosscutting.md) — the most important pattern. It modifies every other mode.

When burnout markers cluster (`tired` 26, `wasted` 23, `useless` 28, `again` 66, `you keep` 10, `cant even` 12, `should have` 25, `should of` 9, time-quantified pain like `12 hours` / `24 hours`), execute with even more discipline: ONE in-flight item, no expansion, no narration, no apology. When recognition modes fire AND burnout is active, the recognition discipline is the floor — execute the spec verbatim with maximum signal density.

**Promote to:** skill — burnout-mode is what saves time when the user is most exhausted.

## Audit trail (changes from the first pass)

What was wrong with the first pass and got fixed:

- **7 fabricated triggers stripped** (zero hits in corpus): `stop talking`, `stop apologizing`, `where is my app`, `you didn't do anything`, `click loads full model`, `specta note`, `no raw values`.
- **Frequency hand-waves replaced with measured counts.** Every trigger phrase in every doc has a measured document-frequency.
- **Two themes merged.** `paste-build-failure-diagnose-and-fix` was the corrective shadow of the recognition mode `recognition-diagnostic-paste-triage`; only the recognition framing kept. `no-rushing-foundational-best-practice` folded into `research-then-execute-no-loops` (same impulse, different angle).
- **8 recognition modes added** — the missing other half. The first pass was entirely defensive; recognition captures the user authoring at their best.
- **Burnout overlay added** — the most critical pattern, missed entirely on pass one.

## Promotion order — the recommended path

I recommend going in this order to land the most leverage soonest:

1. **`burnout-mode-crosscutting`** — applies to every prompt. Promote first.
2. **`recognition-diagnostic-paste-triage`** — covers the most common pattern in the corpus (paste + fix). Highest precision triggers.
3. **`recognition-phased-execution-plan`** — turns the user's authoring into a literal execution contract.
4. **`recognition-frozen-surface`** — protects working files from accidental edits during refactor sweeps.
5. **`recognition-verification-checklist-close`** — converts `[ ]` boxes into a real walk.
6. **`direct-action-no-preamble-no-apology`** — the always-on baseline.
7. The remaining recognition + discipline modes — author skills as the recurring patterns prove themselves in practice.

## What lives where on the chat-mode contract

- **Auto-loaded memory** (`{claude}/projects/<project>/memory/MEMORY.md` + linked entries) — short, always loaded. Use for ABSOLUTE / LOCKED rules.
- **Skills** (`.claude/skills/<slug>/SKILL.md`) — loaded on trigger. Use for behavior patterns that ONLY apply to certain types of work. Recognition modes especially benefit — they only matter when the structural marker is present.
- **Subagents** (`.claude/agents/<slug>.md`) — explicit dispatch via the Agent tool. Use for tasks that need their own context window.
- **Slash commands** (`.claude/commands/<slug>.md`) — typed by user. Use for explicit one-shot invocations.

## What I deliberately did NOT do

- Did not author the `.claude/skills/` or `.claude/agents/` files. Those are the next pass.
- Did not modify `MEMORY.md` or any existing memory entry.
- Did not commit any of this. Working tree only.
- Did not include verbatim user quotes anywhere. Every example paraphrased.
- Did not retain any rage / abuse tokens or slurs.

## Re-running the analysis

The extractor / freq / audit scripts are idempotent:

```sh
node docs/chat-modes/_raw/extract-prompts.js   # rebuild all-prompts.txt
node docs/chat-modes/_raw/freq.js              # rebuild freq.json
node docs/chat-modes/_raw/audit.js             # validate trigger frequencies
node docs/chat-modes/_raw/burnout-probe.js     # spot-check burnout markers
```

Adjust the `SINCE` constant in `extract-prompts.js` to widen or narrow the window. Today: 14 days; the full 66-session corpus would set it to `2026-03-26`.
