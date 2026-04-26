# Template families — preview from fresh-era prompts

> Research artifact. Not committed. Sitting on the desk for review.
>
> Sliced the corpus into thirds (early / mid / late = fresh / mid / burnout). Counted high-quality prompts per recognition family in each third. The pattern is striking: some families drop to **zero** in the mid-third, then partially recover in late. Those are the families where a template would help most — they're the prompts you stop authoring when you're tired.

## Family-density by third (corpus split into 3 × 768 prompts)

| Family | EARLY (fresh) | MID | LATE (burnout) | Template priority |
|---|---:|---:|---:|---|
| **rust-shape-as-spec** | 16 | **0** | 13 | **HIGHEST** — disappears entirely mid-window |
| **ascii-architecture-diagram** | 22 | **0** | 9 | **HIGHEST** — same drop pattern |
| **diagnostic-paste-triage** | 44 | 28 | 22 | High — most-frequent overall |
| **phased-execution-plan** | 40 | 27 | 38 | High — universal, well-shaped |
| **ssot-comparison-table** | 33 | 10 | 25 | High |
| **frozen-surface** | 9 | 23 | 15 | Medium — peaks in mid (debugging mode) |
| **verification-checklist-close** | 1 | 2 | 1 | Low — rare; maybe deprioritize |
| **fork-with-stated-hypothesis** | 0 | 0 | 0 | Skip — short prompts, classifier too strict; handle inline |

The drop-to-zero pattern on `rust-shape-as-spec` and `ascii-architecture-diagram` is the strongest signal: those are the highest-effort authoring patterns. They're the first to vanish when you're depleted. A template that produces them in 30 seconds restores them.

---

## Template 1 — `rust-shape-as-spec` (HIGHEST priority)

### Paraphrased fresh-era example

```
## Trait Definitions

### `engine/src/lexicon/traits.rs`

```rust
pub struct AudioOutput {
    /// Raw PCM samples at `sample_rate` Hz.
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u8,
}

pub struct VoiceProfile {
    /// Named speaker if backend supports preset voices.
    pub speaker: Option<String>,
    /// Natural language style instruction.
    pub instruction: Option<String>,
    /// Reference audio path for voice cloning.
    pub ref_audio: Option<std::path::PathBuf>,
    pub ref_text: Option<String>,
}
```
```

### Extracted template shape

```
## {section_heading}

### `{file_path}`

```rust
{imports}

pub {kind} {Name} {
    {fields}
}
```
```

### Slots

| Slot | Type | Options / hint |
|---|---|---|
| `section_heading` | text | "Trait Definitions" / "Backend Implementations" / "DTO Surface" |
| `file_path` | text (or autocomplete from workspace) | `engine/src/lexicon/traits.rs`, … |
| `imports` | optional textarea | usually `use std::path::Path; use anyhow::Result;` |
| `kind` | radio | `struct` · `enum` · `trait` · `fn` |
| `Name` | text | PascalCase struct name |
| `fields` | reorderable list of rows; each row has: | |
| `→ field_name` | text (snake_case) | |
| `→ field_type` | text or dropdown | `String` · `Option<String>` · `Vec<f32>` · `u32` · `PathBuf` · `bool` · custom |
| `→ doc_comment` | text | optional `///` doc, becomes line above field |

### What the form would feel like

> Section heading: `[Trait Definitions ▼]` (dropdown of common section names + custom)
> File path: `[engine/src/lexicon/traits.rs]` (text or autocomplete)
> Kind: `( ) struct ( ) enum ( ) trait ( ) fn`
> Name: `[VoiceProfile]`
> Fields:
>   `[+ Add field]`
>   `[≡] speaker: Option<String>  /// Named speaker if backend supports preset voices.`
>   `[≡] instruction: Option<String>  /// Natural language style instruction.`
>   `[≡] ref_audio: Option<PathBuf>  /// Reference audio for voice cloning.`
>   (drag to reorder fields)
> [Send]

---

## Template 2 — `ascii-architecture-diagram` (HIGHEST priority)

### Paraphrased fresh-era example

```
## Architecture

```
User speaks
   │
   ▼
┌─────────────────────────────────────┐
│  LEXICON                            │
│                                     │
│  SttBackend trait ─── Whisper impl  │
│                  └─── [future]      │
│                                     │
│  TtsBackend trait ─── Qwen3TTS impl │
│                  └─── Kokoro impl   │
└─────────────────────────────────────┘
   │
   ▼
Rosetta (expression normalization)
   │
   ▼
MAESTRO pipeline
```
```

### Extracted template shape — two sub-modes

This family has **two distinct shapes**; the form should pick which:

**Sub-mode A: Vertical pipeline** (free-floating boxes connected by `↓ / ▼` arrows)

| Slot | Type |
|---|---|
| `nodes` | reorderable list of: `name` (text) + `kind` (radio: simple-label / box-with-contents) |
| `box_contents` | per-box optional list of inner labels (e.g. trait → impl arrows) |

**Sub-mode B: File tree** (├── └── style)

| Slot | Type |
|---|---|
| `root_path` | text |
| `entries` | nested list with `name` + `is_dir` + `children` (recursive) |

### What the form would feel like (sub-mode A)

> Diagram type: `( ) Vertical pipeline (•) File tree`
> Nodes (drag to reorder):
>   `[≡] User speaks` (label)
>   `[≡] LEXICON` (box) — `[Edit contents]`
>   `[≡] Rosetta` (label)
>   `[≡] MAESTRO pipeline` (label)
>   `[+ Add node]`
> [Send]

The form renders the box-art mechanically. You stop spending energy aligning `│` and `└`.

---

## Template 3 — `diagnostic-paste-triage` (HIGH priority — most frequent)

### Paraphrased fresh-era example

> Stop hook: cargo check -p devpulse-engine FAILED. error[E0432]: unresolved import `devpulse_clyffy::cortex::persistence::Surreal`. process didn exit successfully: exit code 101.

### Extracted template shape

```
## Failure context

Tool: {tool}
Crate / scope: {scope}
Intent: {intent}

```
{paste}
```
```

### Slots

| Slot | Type | Options |
|---|---|---|
| `tool` | dropdown | `cargo check -p` · `cargo test -p` · `cargo xtask run-dev` · `pnpm check` · `lefthook run pre-commit` · `biome lint` · `svelte-check` · `tsc --noEmit` · custom |
| `scope` | autocomplete from workspace members | `devpulse-engine` · `devpulse_desktop_backend` · `devpulse-clyffy` · `model-loader` · `xtask` · `--workspace` |
| `intent` | radio (multi-select OK) | `Just fix THIS diagnostic` · `Fix all errors AND all warnings in the paste` · `Explain root cause first` · `Verify with manual test after fix` · `Don't expand scope to neighbors` |
| `paste` | textarea | the raw output |

### What the form would feel like

> Tool: `[cargo check -p ▼]`
> Scope: `[devpulse_desktop_backend ▼]` (autocomplete from `Cargo.toml` workspace members)
> Intent (multi-select):
>   `[x] Just fix THIS diagnostic`
>   `[ ] Fix all warnings too`
>   `[x] Don't expand scope to neighbors`
>   `[ ] Explain root cause first`
> Paste:
>   `[multiline text area]`
> [Send]

Rendered prompt:

> ## Failure context
>
> **Tool:** `cargo check -p`
> **Scope:** `devpulse_desktop_backend`
> **Intent:** Just fix this diagnostic. Don't expand scope to neighbors.
>
> ```
> error[E0432]: unresolved import …
> ```

This is a 4-click form replacing what you currently type when burned out (often: just the paste with no framing).

---

## Template 4 — `phased-execution-plan` (HIGH priority — universal)

### Paraphrased fresh-era example

```
## Complexity Check — Escalation Trigger

### Phase 1 (Rule-based, ship first)

```rust
pub struct ComplexityChecker {
    rules: Vec<ComplexityRule>,
}
```

Examples of always-escalate patterns:
- RESEARCHER + deep synthesis → escalate
- PSYCH + nuanced sentiment → escalate

### Phase 2 (MLP scorer, trained from telemetry)

Small binary classifier trained on real usage data.
Input: task embedding + minion role + context size.
Output: simple vs complex.
Trained from ROTI/quality telemetry.
```

### Extracted template shape

```
## {plan_name}

### Phase {N} ({phase_label})

{phase_body}

Files:
{files_list}

Verify:
```bash
{verify_command}
```

### Phase {N+1} ...
```

### Slots

| Slot | Type |
|---|---|
| `plan_name` | text |
| `phase_count` | dropdown | `2` · `3` · `4` · `5` · `6` |
| `phases` | reorderable list of rows; each row has: | |
| `→ label` | text (e.g. "Rule-based, ship first") |
| `→ body` | textarea (free-form prose, may include code) |
| `→ files` | list of paths |
| `→ verify` | dropdown of common gates |

### What the form would feel like

> Plan name: `[Complexity Check — Escalation Trigger]`
> Phase count: `[3 ▼]`
> Phases (drag to reorder):
>   **Phase 1**
>     Label: `[Rule-based, ship first]`
>     Body: `[…rule struct here…]`
>     Files: `kernel/devpulse-clyffy/src/cortex/escalate/rules.rs`
>     Verify: `[cargo check -p devpulse-clyffy ▼]`
>   **Phase 2**
>     Label: `[MLP scorer]`
>     Body: `[…]`
>     Files: `kernel/devpulse-clyffy/src/cortex/escalate/scorer.rs`
>     Verify: `[cargo test -p devpulse-clyffy ▼]`
>   **Phase 3**
>     Label: `[Telemetry harness]`
>     ...
> [Send]

When the user already authored the plan well, the form reproduces the structure. When tired, the form forces the structure even from a hasty fill-in.

---

## Template 5 — `ssot-comparison-table` (HIGH priority)

### Paraphrased fresh-era example

```
## Clyffy Voice Profiles

| Profile | Backend | Speaker | Instruction |
|---|---|---|---|
| `clyffy-default` | Qwen3-TTS | vivian | "Warm, calm, knowledgeable." |
| `clyffy-casual` | Qwen3-TTS | vivian | "Relaxed, conversational." |
| `clyffy-focused` | Qwen3-TTS | ryan | "Focused, precise, minimal warmth." |
```

### Extracted template shape

```
## {table_heading}

| {col_1} | {col_2} | … |
|---|---|---|
| {row_1_cell_1} | {row_1_cell_2} | … |
| {row_2_cell_1} | {row_2_cell_2} | … |
```

### Slots

| Slot | Type |
|---|---|
| `table_heading` | text |
| `column_count` | dropdown | `2` · `3` · `4` · `5` |
| `column_headers` | list of texts |
| `rows` | reorderable list, each is a list of cells matching column_count |

### What the form would feel like

> Heading: `[Clyffy Voice Profiles]`
> Columns: `[4 ▼]`
> Header row: `[Profile] [Backend] [Speaker] [Instruction]`
> Rows (drag to reorder):
>   `[≡] clyffy-default | Qwen3-TTS | vivian | "Warm, calm, knowledgeable."`
>   `[≡] clyffy-casual  | Qwen3-TTS | vivian | "Relaxed, conversational."`
>   `[≡] clyffy-focused | Qwen3-TTS | ryan   | "Focused, precise, minimal warmth."`
>   `[+ Add row]`
> [Send]

Drag-to-reorder rows is the user's "rearranging priority of rows" idea, applied here directly.

---

## Template 6 — `frozen-surface` (MEDIUM priority)

### Paraphrased fresh-era example

```
## SITUATION REPORT

The frontend wizard is well-built. ModelsStep.svelte follows the spec.
The Tauri commands are defined via specta bindings.

THE PROBLEM IS ENTIRELY BACKEND.

## DO NOT TOUCH THESE FILES (they're correct):

- features/setup-wizard/SetupWizard.svelte
- features/setup-wizard/wizard.types.ts
- features/setup-wizard/wizard.runes.svelte.ts
- sys/generated/bindings.ts

## PHASE 1: DIAGNOSE THE BACKEND
...
```

### Extracted template shape

```
## Situation report

{situation_text}

## DO NOT TOUCH (working correctly)

{protected_files}

## In scope

{in_scope_text}

## Out of scope / Deferred

{deferred_list}
```

### Slots

| Slot | Type |
|---|---|
| `situation_text` | textarea (1–3 sentences) |
| `protected_files` | list of paths (autocomplete from `git diff --name-only HEAD~5` recent changes) |
| `in_scope_text` | text (1 sentence describing the touchable area) |
| `deferred_list` | list of items, drag-to-reorder by priority |

### What the form would feel like

> Situation: `[textarea]`
> Protected files (multi-select from recent diffs):
>   `[x] features/setup-wizard/SetupWizard.svelte`
>   `[x] features/setup-wizard/wizard.types.ts`
>   `[x] sys/generated/bindings.ts`
>   `[ ] features/setup-wizard/ModelsStep.svelte`
>   ...
> In scope: `[Tauri command Rust implementations behind the bindings]`
> Deferred (drag-to-reorder by priority):
>   `[≡] Model swap UX`
>   `[≡] Telemetry spans`
>   `[≡] Code indexer`
> [Send]

---

## Template 7 — `verification-checklist-close` (LOW priority — rare)

### Paraphrased fresh-era example

```
## Verification Checklist

- [ ] `cargo check -p devpulse_desktop_backend` — zero errors after Phase 1
- [ ] `pnpm svelte-check` — zero errors after Phase 2
- [ ] REH server spawns and `/healthz` returns 200
- [ ] WebviewWindow loads VS Code workbench
- [ ] Server stops cleanly on app exit
```

### Extracted template shape

```
## Verification Checklist

{items}
```

### Slots

| Slot | Type |
|---|---|
| `items` | reorderable list, each item is either: | |
| `→ a preset gate` (dropdown) | `cargo check -p X` · `pnpm check` · `pnpm svelte-check` · `lefthook run pre-commit` · `cargo test -p X` · `xtask run-dev — boot reaches ready` · custom |
| `→ a custom check` (free text) | "REH server spawns and /healthz returns 200" |

### What the form would feel like

> Add gate: `[cargo check -p ▼ devpulse_desktop_backend]` `[+]`
> Add gate: `[pnpm svelte-check ▼]` `[+]`
> Add custom: `[REH server spawns and /healthz returns 200]` `[+]`
> Reorder: drag-handle on each row
> [Send]

Probably ride-along with the phased-plan template — most checklists appear at the END of a phased-plan prompt anyway. Could be a sub-template invoked from inside Template 4.

---

## Template 8 — `fork-with-stated-hypothesis` (handle inline, no template)

The classifier found zero in early-window because these prompts are **short** (under 600 chars), so they didn't pass the 2+ structural-marker filter. They don't need a template — they're already short and well-shaped. A template would add friction.

Better delivery: a tiny slash command `/fork "<X>" vs "<Y>" — my hypothesis: <Z>` that just wraps the fork in a recognized header. Cheaper than a form.

---

## What this means for delivery shape

Three families show the *strongest* template-payoff signal (drop-to-zero in mid-window): `rust-shape-as-spec`, `ascii-architecture-diagram`, and to a lesser extent `ssot-comparison-table`. Those three are where templates would most reliably move the needle.

Three more (`diagnostic-paste-triage`, `phased-execution-plan`, `frozen-surface`) are universally useful — high-volume, structured authoring that templates would compress.

One (`verification-checklist-close`) is rare enough to be a sub-template inside `phased-execution-plan` rather than its own form.

One (`fork-with-stated-hypothesis`) doesn't need a template.

So if we ship templates, the realistic count is **5–6 forms**, not 8. Highest leverage: ship `diagnostic-paste-triage` and `phased-execution-plan` first because they're highest-volume; ship `rust-shape-as-spec` and `ascii-architecture-diagram` next because that's where templates RESCUE patterns that disappear under fatigue.

## Decision points before we leave parking lot

**Delivery shape:**

- **Way 1** — YAML files + a slash command (`/compose <template>`) that walks you through the slots in chat. Cheapest. ~2h to wire all 5–6 templates.
- **Way 2** — Devtool tab in the desktop app with real form UI (dropdowns, drag-to-reorder rows, live markdown preview, "send to chat"). ~half-day. Looks polished, lower friction.
- **Way 3** — YAML schema as the source of truth; both the slash command AND the devtool tab read it. Most work upfront, smallest long-term cost. ~day.

**Template scope (which families to actually ship):**

- **Tight** — only `diagnostic-paste-triage` + `phased-execution-plan` (the two highest-volume). Ship two and see if you actually use them before building more.
- **Recovery-focused** — also include `rust-shape-as-spec` and `ascii-architecture-diagram` (the rescue-when-tired set).
- **Full** — all six (drop fork + maybe verification-checklist as standalone).

**Order:**

- Build the easiest first (`diagnostic-paste-triage` is by far the simplest — 4 fields).
- Or build the *highest-value* first (`phased-execution-plan` is the most structurally complex and saves the most authoring effort).

---

This file is **not committed**. It's the parking-lot artifact for you to read, sleep on, and tell me which delivery shape + scope + order you want. When you give a single one-line answer (e.g. "Way 1, tight scope, easiest-first"), I'll go.
