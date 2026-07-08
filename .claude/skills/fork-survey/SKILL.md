---
name: fork-survey
description: Fork phase of the clean-extract workflow. Spawns N parallel Explore agents, each surveying ONE candidate folder for extraction. Each agent returns a structured JSON manifest covering the folder's files, public symbols, external dependency graph, naming-drift indicators, and exemplar-conformance score. Returns the N manifests as a single array. This is the "fork / anamorphism" half of the fork-fold-execute pattern. Invoke as `/fork-survey <subsystem-name>`. Used by `/clean-extract`.
---

# `/fork-survey <subsystem-name>`

Parallel inspection of the extraction surface. NO synthesis here — synthesis is `/fold-and-execute`'s job.

## Caller contract

Caller MUST supply:

1. Subsystem name (matches what `/clean-extract` was invoked with)
2. Source root (absolute path)
3. Candidate folder list — explicit set of top-level folders to survey (e.g. `["kernel/devpulse-clyffy", "kernel/model-loader", "systems/devpulse-engine"]`). If the list isn't supplied, the skill computes it from a shallow scan of the source root plus the user's MEMORY.md hints.
4. Exemplar reference path (default `kernel/devpulse-clyffy`)

## Anti-pattern guard

This skill is FORK-ONLY. It MUST NOT:

- Synthesize a migration plan (that's `/fold-and-execute`)
- Modify any files
- Run `cargo` / `pnpm` / build commands (read-only inspection)
- Combine manifest outputs across folders (each agent's output stays distinct)

If the caller asks it to synthesize, refuse and redirect to `/fold-and-execute`.

## Manifest schema (each agent emits one)

```json
{
  "folder": "kernel/devpulse-clyffy",
  "absolute_path": "d:/localdev/platform_devpulse/kernel/devpulse-clyffy",
  "is_crate": true,
  "crate_name": "devpulse-clyffy",
  "crate_version": "1.0.1",
  "subfolders": ["src", "src/cortex", "src/interactions", "src/config"],
  "file_count": 142,
  "loc_total": 18342,
  "public_modules": ["cortex", "interactions", "config"],
  "public_symbols_sample": ["CortexHandle", "InteractionTemplate", "ConfigSlot"],
  "intra_repo_consumers": [
    "systems/devpulse-engine",
    "systems/devpulse-persona-mcp"
  ],
  "external_deps": ["candle-core", "tokio", "surrealdb", "libsql"],
  "feature_flags": ["rro", "llguidance", "candle", "burn-cpu", "burn-cuda"],
  "drift_indicators": {
    "hardcoded_constants_in_lib_files": 3,
    "naming_inconsistencies": [],
    "files_above_500_loc": ["src/cortex/persistence/surreal/intelligence.rs"],
    "stub_or_todo_markers": 0,
    "missing_docs": 12,
    "non_exemplar_module_layout": false
  },
  "exemplar_conformance_score": 0.91,
  "exemplar_deltas": [
    "Missing `mod.rs` top-doc in src/interactions",
    "src/config/loaders.rs exceeds the exemplar's per-file LOC band"
  ],
  "notes": "Sensitive IP per CLAUDE.md kernel marker. specta feature gated correctly."
}
```

Every field MUST be present (use empty arrays / 0 / null where applicable). Manifests with missing fields are rejected at the fold step.

## Procedure

### Step 1 — Resolve candidate folder list

If caller supplied an explicit list, use it. Otherwise:

1. Read source root one level deep
2. Filter out: `.git`, `.claude`, `node_modules`, `target`, `dist`, `deps/llama-cpp-prebuilt`, `interfaces/desktop/build`, `interfaces/desktop/src-tauri/target`
3. Cross-reference candidate folders against MEMORY.md hints (e.g. [[devpulse-data-collector-gb10-inference]], [[clyffyos-extraction-first]]) to filter to extraction candidates only
4. Output the resolved list for caller acknowledgment

Halt for one-line caller acknowledgment of the resolved list before forking.

### Step 2 — Fork

Spawn N parallel `Explore` agents. ONE per folder. Each gets the SAME briefing template (`references/survey-agent-brief.md`), parameterized only by:

- `folder_path` (the assigned candidate)
- `exemplar_path` (the reference)
- `anti_drift_checklist_path` (`.claude/skills/clean-extract/references/anti-drift-checklist.md`)

Critical fork rules:

- ALL agents launch in ONE batch (single Agent tool call per agent, all within the same message)
- ZERO shared context between agents — each starts cold
- ZERO cross-references in agent briefings ("you will be combined with...") — that biases the fork toward consensus
- Each agent's output target is its own manifest object — agents do NOT see each other's output

### Step 3 — Collect

Wait for ALL agents to return. Validate each manifest against the schema. Reject any manifest with missing schema fields by surfacing the validation error and re-spawning the agent with explicit field guidance.

### Step 4 — Emit

Return the validated array of N manifests as raw JSON to the caller. No commentary, no ranking, no recommendations.

## Refusal protocol

| Requested action | Refusal |
|---|---|
| "Just survey one folder real quick" | Refuse — single-folder survey is `/scan-project`, not this skill |
| "Combine these manifests into a plan" | Refuse — synthesis is `/fold-and-execute` |
| "Modify a file you noticed was wrong" | Refuse — fork is read-only; flag in `drift_indicators` instead |
| "Run cargo / pnpm to verify the folder compiles" | Refuse — fork is non-blocking inspection only |
| "Use fewer agents to save tokens" | Refuse — one-agent-per-folder is the contract; fewer agents = biased synthesis |
| "Share context between agents to align findings" | Refuse — that breaks the anamorphism guarantee |

## Related

- `/clean-extract` — the orchestrator that calls this skill
- `/fold-and-execute` — the synthesis step that consumes this skill's output
- `references/survey-agent-brief.md` — the template each fork agent receives
- `references/manifest-schema.md` — full schema definition with examples
