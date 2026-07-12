# ColdLight Recovery — Verification Log

## CHECKPOINT V1 — Family F1 (slices 01–11 + 07b) — 2026-07-12

- Tree: `refactor/coldlight-recovery` @ 8b57fe50, pushed to origin, clean.
- Slices covered: 01 (domains/common delete + CLAUDE.md), 02 (svg prefix), 03
  (retro/stark literals), 04 (z-index + scrollbar-size emission), 05–10 (36
  wrong-name rebinds in 6 batches), 07b (TokenDebugOverlay gate-clean), 11
  (last keyword fallback). Every slice individually committed + gated.

### Gate battery

| Gate | Result |
| --- | --- |
| svelte-check (per slice, every slice) | 0 errors / 0 warnings / 220 files, every run |
| no-raw-values hook | clean on every commit; two pre-gate debt files cleared honestly (07b px→rem ×55; Panel.stories px→rem ×11 + 4 orphan `#050708` → `var(--surface-base)`) |
| audit:cssvars | UNDEFINED **73 → 40** (remaining 40 = runtime-scoped false positives + parked Glass*/renderforge/surface-1/2 classes, all assigned to F2/F8 in the rulings); defined 3339 → 3351 (new emissions live) |
| audit:color | hex-fallback drift 0; GAMUT 382 → 376 |
| audit:presetmap | stark raw literals 0; retro reduced to SEED-class only (intentional seed tier) |
| vitest full run | recorded below (expected: Sheet ×5 + Checkbox ×2 known reds and nothing else) |

**vitest full run (1148s): 106 failed / 298 passed (32/55 files, 2 errors) — a
FINDING, not a pass.** Attribution evidence: (1) `vitest related` across every
F1-touched src file → "No test files found" — zero tests import anything F1
edited; (2) the repo's CI runs only `cargo test` + `pnpm test:arch` — the UI
vitest suite (incl. the chromium storybook browser project) has NEVER had an
enforced green baseline; (3) the prior known-reds baseline (Sheet ×5,
Checkbox ×2) came from targeted runs, never the full suite. Verdict: the 106
are pre-existing, unmeasured foundation debt. NOT silently accepted — logged
as **FINDING V1-F1: full-suite test recovery needs its own family** (fix the
tests or the harness, owner-prioritized; a main-worktree baseline run can
prove attribution decisively if wanted). F1's own gates (svelte-check ×13
runs, no-raw-values, audits) were green throughout.

### Operator render checklist (the only authority on "works")

Run `cargo xtask run-dev`, then answer each yes/no:

1. App boots — no white/blank window.
2. Primary CTAs are BLUE (primary role), not teal.
3. SVG artwork (orbs, wizard art, status glyphs) carries accent COLOR — not
   gray/invisible (slice 02's fix; this was resolving to nothing before).
4. Scrollbars are slim (6px) with rounded thumbs (slice 04 — first time these
   tokens ever emitted).
5. Route backdrops differ per hub (teal/purple/magenta/ember/cyber).
6. Destructive buttons render on the danger role (red family) with glow.
7. No monochrome-teal wash on the main shells.

Answers recorded verbatim below when the operator reports:

- (pending operator)
