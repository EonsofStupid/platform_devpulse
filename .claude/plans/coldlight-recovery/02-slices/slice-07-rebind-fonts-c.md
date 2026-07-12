# Slice 07 — WRONG-NAME rebinds, batch C (font-family + debug-overlay tokens)

## GOAL

Five files using Tailwind-style names ColdLight never emitted; rebind to the
verified emitted names (rulings §3.1).

## PRECONDITIONS

- Slices 01–06 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rln -- "--font-family-mono" interfaces/desktop/src --include="*.svelte" | wc -l` → ≥5. Zero → STOP.
- Probe 2: `grep -n -- "--font-mono" interfaces/desktop/src/lib/design/styles/primitives/typography.css` → ≥1 (target exists).
- Probe 3: `grep -n -- "--danger-fill\|--accent-fg" interfaces/desktop/src/lib/design/styles/semantic/role.css interfaces/desktop/src/lib/design/styles/semantic/accent.css` → ≥2 hits (targets exist).

## FILES (REVISED 2026-07-12 after execution STOP — grep-verified actual paths)

1. `interfaces/desktop/src/lib/design/debug/TokenDebugOverlay.svelte` (~:508, :563, :567–:593)
2. `interfaces/desktop/src/lib/devtools/system/datastores/project-db/feature/ProjectDbDevtool.svelte`
3. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderConfirmPanel.svelte`
4. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderProgressPanel.svelte`
5. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderTokenStrip.svelte`

NOT in this slice (handled by slice 08): `downloader/ui/BundleFileRow.svelte` and
`sys/ErrorOverlay.svelte` — both also carry `--font-family-mono` and are slice 08
FILES rows; their hits are EXPECTED residuals in this slice's verify.

## STEPS

1. ALL five files: every `var(--font-family-mono` … `)` → `var(--font-mono)` (drop fallbacks).
2. File 1 only: every `var(--signal-error-fill)` → `var(--danger-fill)` (~:567, :590; expect 2).
3. File 1 only: every `var(--signal-error-main)` → `var(--signal-error)` (~:568, :569, :591, :593; expect 4).
4. File 1 only: every `var(--text-on-accent)` → `var(--accent-fg)` (~:563, :573; expect 2).

## IMPORT REPOINTS

None.

## VERIFY

- `--font-family-mono` across `interfaces/desktop/src/**/*.svelte` → EXACTLY 2 remaining files: `downloader/ui/BundleFileRow.svelte` and `sys/ErrorOverlay.svelte` (slice 08's rows). Any other residual → fail.
- `--signal-error-fill|--signal-error-main|--text-on-accent` across `*.svelte` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.

## KNOWN REDS

Sheet/Checkbox pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the five files>`

## STOP CONDITIONS

Downloader-area grep (`--font-family-mono` under domains/app/models) returns a set
other than {BundleFileRow, DownloaderConfirmPanel, DownloaderProgressPanel,
DownloaderTokenStrip} → STOP, report the actual list. Expected string absent →
STOP + report.
