# Naming Conventions — SSOT for boring, agnostic, consistent names

> Locked 2026-06-24. User preference: BORING names that read the same
> to every engineer regardless of context. NEVER clever. NEVER cute.
> NEVER context-dependent abbreviations.

## Crate name pattern

```
<subsystem-prefix>-<facet>
```

Examples (verified-good in current workspace):

- `devpulse-engine` → `clyffyos-engine` (subsystem prefix changes, facet stays)
- `devpulse-clyffy` → `clyffyos-cortex` (facet renamed to its actual ROLE, not the legacy product name)
- `devpulse-persona-mcp` → `clyffyos-persona-mcp` (composite facet `persona-mcp` is acceptable — both words have meaning)
- `model-loader` → `clyffyos-model-loader` (gain prefix because the bare name collides outside its monorepo context)

Rules:

1. **Lowercase + hyphens** for crate names (Rust convention)
2. **Subsystem prefix mandatory** when the crate ships outside the monorepo of origin — collision avoidance
3. **Facet describes ROLE not BRAND** — `cortex` (what it does) beats `clyffy` (what it's branded as)
4. **No version / variant suffixes** in the name — that's the version field's job (NOT `crate-v2`)
5. **No abbreviations** unless they're industry-standard (`mcp`, `rrd`, `gpu` ok; `cfg` no — write `config`)
6. **No marketing prefixes** (NOT `super-`, `mega-`, `ultra-`; the user mocks these)

## Binary name pattern

```
<subsystem-prefix>d   (for daemons)
<subsystem-prefix>-<verb>   (for one-shot tools)
```

Examples:

- `clyffyd` — the ClyffyOS server daemon
- `clyffyos-fetch` — one-shot tool
- `xtask` (the workspace orchestrator — bare name OK because it's a workspace convention)

Rules:

1. Daemons end in `d` (unix convention — `sshd`, `systemd`, `dockerd`)
2. One-shot tools use a verb: `fetch`, `verify`, `regen`
3. Single bin per crate by default; multi-bin allowed but each must justify its existence in the crate docstring

## Module name pattern

Within a crate's `src/`:

```
src/<noun>/        # what it OWNS — config, cortex, interactions, devices
```

NOT:

```
src/<verb>/        # NEVER what it DOES — never src/loading/, src/managing/
src/<adjective>/   # NEVER mood/state — never src/main/, src/extra/, src/internal/
src/utils/         # FORBIDDEN — every utility belongs SOMEWHERE specific
src/helpers/       # FORBIDDEN — same as utils
src/common/        # FORBIDDEN — same
src/shared/        # FORBIDDEN — same
src/lib/           # FORBIDDEN — `lib.rs` IS the lib
```

Exception: standard Rust conventions — `bin/`, `tests/`, `examples/`, `benches/`.

## Function naming

Pattern:

```
<verb>_<noun>   # do_thing
get_<noun>      # accessor (read-only)
set_<noun>      # mutator
new_<type>      # constructor (or just `new()`)
try_<verb>      # fallible variant
<verb>_async / <verb>_sync   # ONLY when both variants exist and disambiguation needed
```

Banned patterns:

- `handle_<x>` — too generic; what does "handle" mean? Use `process_`, `validate_`, `dispatch_`
- `do_<x>` — same
- `make_<x>` — prefer `build_` or `new_`
- `compute_<x>_helper` / `<x>_internal` — the `_helper` / `_internal` suffix is noise; visibility is `pub(crate)` if scope-limited

## Feature flag naming

Pattern:

```
<backend>-<variant>   # burn-cpu, burn-cuda, burn-wgpu
<facet>               # specta, guardian, llguidance (capability-named features)
<consumer>-<backend>  # model-loader-cuda (consumer alias chain)
```

Banned:

- `default-features`, `extra-features`, `more-features` — features describe CAPABILITIES, not posture
- `with-x`, `enable-x` — verbose; the feature being declared IS the enable
- `nightly`, `experimental`, `unstable` — declare stability via documentation, not via feature name

## Folder name pattern (extraction)

When moving a folder during extraction:

```
old: kernel/devpulse-clyffy/
new: clyffyos/kernel/clyffyos-cortex/
```

Pattern:

```
<new-root>/<original-tier-folder>/<new-crate-name>/
```

- `<new-root>` = the new repo root
- `<original-tier-folder>` = `kernel/` or `systems/` — preserved (architectural tier matters)
- `<new-crate-name>` = renamed per crate-name rules above

NEVER flatten tiers during a move (kernel/ stays kernel/; systems/ stays systems/). Tier collapse loses architectural information.

## Repo name pattern

User-locked picks:

- `clyffyos` — single lowercase word
- `devpulse-telemetry` — kebab-case for the shared crate publisher
- `wardenclyffe` — pre-existing user repo, conventions don't apply retroactively

Rules:

1. GitHub repo names lowercase or kebab-case
2. Match the dominant crate name when there's one obvious primary crate
3. Avoid `<prefix>-platform`, `<prefix>-monorepo`, `<prefix>-workspace` — the repo IS implicitly that

## Anti-drift trip wires

A naming-conventions violation surfaces as a `drift_indicator` in the fork-survey manifest. The fold step refuses to plan a MOVE/RENAME that introduces NEW drift. Existing drift in source can be carried with explicit acknowledgment, but never added.

| Trip wire | Pattern |
|---|---|
| Underscore in crate name | `my_crate` instead of `my-crate` |
| Generic facet | `utils`, `helpers`, `common`, `shared` |
| Marketing prefix | `super-`, `mega-`, `ultra-`, `pro-` |
| Verb folder | `src/loading/`, `src/managing/` |
| Branded facet on extracted crate | `clyffy-cortex` (legacy brand) instead of `clyffyos-cortex` |
| Version-in-name | `engine-v2`, `cortex2` |
| Abbreviation noise | `cfg`, `mgr`, `svc` (use `config`, `manager`, `service`) |
| Hungarian / type prefix | `iEngine`, `tCortex`, `_internalState` |
