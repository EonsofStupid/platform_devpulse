# B8.n — cortex-purge series: census-bucketed sweep protocol

## GOAL

Kill B8 app-wide (operator ruling 2026-07-12: **"there is no cortex — it is
all via ClyffyOS"**). Every frontend surface presenting an embedded kernel —
"Cortex · embedded" badges, cortex routes/labels/aria, preset-family names —
re-presents as Clyffy/ClyffyOS OVER THE WIRE, names flowing from
`kernel_terms.toml` → `terminology.ts` (connectome public surfaces:
Memory · Thinking · Councils). The wizard seam is already clean (08/R5).

## WHY census-at-execution

04 counted 44 files on 2026-07-12; 08/R5 + R6 will have moved the tree by
the time this runs. The executor RE-CENSUSES and buckets fresh — a stale
file list would violate the no-drift law this chain exists for.

## PROTOCOL (each bucket = one slice-commit, ≤5 files, own verify)

1. CENSUS (read-only, pasted into the report):
   - `grep -rln -i "cortex" interfaces/desktop/src/ --include="*.svelte" --include="*.ts" | grep -v generated | sort`
   - Classify every hit: (a) customer-visible STRING · (b) aria/a11y label ·
     (c) route/registry id · (d) code identifier (fn/var/type/preset id) ·
     (e) comment/doc.
2. BUCKETS, executed in this order (each depends on the previous being
   committed):
   - **B8.1 — devtool surfaces**: the `/devtools/clyffy/memory/cortex` entry
     in the devtool registry SSOT (`src/lib/devtools/registry.ts`) + its
     route folder name + GovernanceDevtool's "Cortex · embedded" badge
     (factually FALSE post-severance — becomes the wire-truth label from
     terminology). Route renames follow the registry SSOT law: one registry
     entry + one route folder, moved together.
   - **B8.2 — dashboard**: LiveSubsystemStrip `label="Cortex"` +
     "Cortex warms once…" copy → terminology-bound labels.
   - **B8.3 — aria + labels**: SlotsDevtool, AnatomyConstellation aria
     strings → layman equivalents (aria copy follows the same
     no-hardcoded-English law where a copy SSOT reaches the component;
     where none reaches, the terminology-generated constant is the source).
   - **B8.4 — visual preset families/ids**: any `cortex-*` preset/token ids
     in TOKEN SOURCES → renamed in the source JSON + `ds:tokens:build` +
     ALL wearers repointed in the same slice (CC-007 multi-search: direct,
     string-literal, type, test).
   - **B8.5 — identifiers + comments residue**: code identifiers renamed
     (multi-search per rename), comments corrected. Anything importing
     across boundaries → enumerate first.
3. Per bucket: `pnpm check` 0/0 · `no-raw-values` 0 · re-grep shows the
   bucket's hits at ZERO · commit + push
   (`refactor(desktop): B8.n — <bucket> cortex vocabulary → wire truth`).
4. EXIT: the census grep returns ZERO non-generated hits (generated files
   regenerate clean once sources are clean — if a generated file still
   carries "cortex", its SOURCE was missed: find it, never edit emitted).

## VOCABULARY LAW

Replacement names come from `kernel_terms.toml` → `terminology.ts`
(`pnpm generate:terminology` after any term addition) or existing layman
copy — NEVER invented per-file. If a surface needs a term the SSOT lacks,
ADD the term to kernel_terms.toml (all fields) in that same slice and regen.
"Clyffy" and "connectome public surfaces: Memory · Thinking · Councils" are
the sanctioned frames (see `project_cortex_surfaces` brief).

## KNOWN REDS

Baseline vitest only. Sonar's React-hook rule on `.svelte.ts` files — never
rename hooks for it.

## STOP CONDITIONS

- A "cortex" hit is load-bearing beyond vocabulary (persisted keys, wire
  fields, route ids that external state references) → STOP that bucket,
  report the coupling.
- A rename would cross into `systems/` crates → out of scope here; report.
