# Boundary → Spec map

Every boundary has a home for its build spec. This file is the convention
for *finding* that home, *deciding* what to do with what you find, and
*growing* the convention when a new pattern emerges. It is the detail
behind `/spec-first` Steps 1–3 and 7.

The rule underneath all of it: **the boundary's doc is the SSOT for the
boundary.** Folders and patterns map to docs. As operator and project
develop a new pattern, it gets a home here so the next session inherits
it instead of re-inventing it.

## Pattern → where its spec lives

| Boundary pattern | Spec home (search first) | Notes |
|---|---|---|
| Rust crate / kernel module | colocated `README.md` / `*.md` in the crate, then `docs/platform/*.md` | If it crosses the IP boundary, the terms live in `systems/devpulse-engine/ip/kernel_terms.toml` → `terminology.ts`. Kernel vocabulary stays in `kernel/` (CI-enforced). |
| Platform subsystem (boot, services, signals, config) | `docs/platform/*.md` | The platform specs are the topology-level SSOT (e.g. `CLYFFY-COGNITIVE-FOUNDATION.md`). |
| Terminology / layman naming | `kernel_terms.toml` → `ip_term!` → `terminology.ts` | The ONLY place a layman label is defined. Grep here first before any label map ([[kernel-terms-ssot]]). |
| Devtool | the locked devtool standard (Status / Config / Logs / Actions / Debug via `ServiceDevtoolShell`) + the devtool-registry SSOT at `interfaces/desktop/src/lib/domains/platform/_shared/devtool-registry.ts` | Adding a devtool = one registry entry + one route folder. |
| Svelte domain | colocated within the `feature / ui / data-access / util` library-type split | The Nx library-type convention is the spec for *shape*; behavior specs colocate. |
| Content corpus | `docs/knowledge_library/*.md` | Data-model + selection-logic + minion-query contract live in `00_MASTER_SPEC.md`. |
| Migration / cross-cutting change | `~/.claude/plans/*.md` | A migration contract (e.g. `architecture-corrections-2026-06-27.md`) is the spec for a multi-boundary move. |
| Durable cross-session fact | the memory store (`MEMORY.md` index → topic file) | Not a build spec, but the place a *convention* or *decision* is recorded so it survives compaction. |

## Search order (Step 2)

1. **Colocated** — `<boundary>/README.md`, `<boundary>/SPEC.md`, any `<boundary>/*.md`.
2. **Platform** — `docs/platform/`.
3. **Knowledge library** — `docs/knowledge_library/`.
4. **Terminology SSOT** — `kernel_terms.toml` (for any term/vocabulary boundary).
5. **Plans** — `~/.claude/plans/`.
6. **Memory** — `MEMORY.md` index, then the topic file.

Grep the boundary's distinctive symbols across `docs/` before concluding
"no spec." A Glob/Grep **timeout under FS load is not absence**
([[find-timeout-is-not-absent]]) — narrow the path and retry.

## Treatment decision (Step 3)

| Treatment | Trigger | What you do |
|---|---|---|
| **Extend** | Doc is correct + current, missing only the new surface | Minimum-diff add. Touch nothing else. ([[extend-over-rewrite]]) |
| **Reframe** | Records accurate, framing stale (right file:line, superseded topology/naming) | Dated `⚠ REFRAMED` header. Preserve the records below it. |
| **Rewrite** | Foundation is dead (architecture no longer exists) | Replace body, bump version, keep the "was rewritten" note. |
| **Absorb** | Duplicate of another doc's SSOT | Fold unique content into the SSOT, verify, THEN delete. ([[absorb-before-delete]]) |
| **New** | Genuinely no spec for this boundary | STOP for `go` (Step 5). Place per this table. Boring name. One home per concept. |

### Reframe header shape (proven 2026-06-28)

```
> ## ⚠ REFRAMED — <date>
>
> <one-line: what this doc accurately is, and the pivot it predates>
>
> - **Split / relocation** — <where the described pieces now live>
> - **Renames land in Phase N, with the code** — <term → term>; the cited
>   code paths/constants stay ACCURATE until that phase renames them.
> - **Deferred, not retired** — <out-of-scope pieces>, deferred not killed.
> - **Still valid** — <records/citations/contracts preserved below>.
>
> Current truth: <pointer to the live SSOT doc>. Records below preserved.
```

## Anti-rules

- **Never pre-rename code-path citations ahead of the code.** A doc that
  cites `kernel/.../cortex/` stays right until the rename phase flips the
  code. Renaming the doc first makes it lie.
- **Never declare deferred work "retired"/"dead."** Say "not part of this
  phase." Scoping something dead is the operator's call. ([[deferred-not-retired]])
- **Never spawn a second doc where one already has the concept.** Extend or
  absorb. Proliferation is rot.
- **Never hardcode a path/id/dim/host into a spec.** Describe the agnostic
  seam; the config supplies the value. ([[no-hardcoding-clyffy-agnostic]])

## Growing the convention (Step 7)

When a unit of work establishes a NEW folder shape or pattern that future
work should follow:

1. Record it in the boundary's own spec (a line is enough).
2. If it is a cross-boundary standard, add a row to the **Pattern → spec
   home** table above, and save a `reference` memory so it survives
   compaction.
3. Name the pattern after what it is, not who made it — boring names,
   aligned to the existing tree.

This is the mechanism behind "the conventions grow dynamically off folders
and patterns the operator and project develop together." The map is not
fixed; it accretes. But it accretes *deliberately*, through this step —
not by silent drift.
