# Slice 07 — WRONG-NAME rebinds, batch C (font-family + debug-overlay tokens)

## GOAL

Five files using Tailwind-style names ColdLight never emitted; rebind to the
verified emitted names (rulings §3.1).

## PRECONDITIONS

- Slices 01–06 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rln -- "--font-family-mono" interfaces/desktop/src --include="*.svelte" | wc -l` → ≥5. Zero → STOP.
- Probe 2: `grep -n -- "--font-mono" interfaces/desktop/src/lib/design/styles/primitives/typography.css` → ≥1 (target exists).
- Probe 3: `grep -n -- "--danger-fill\|--accent-fg" interfaces/desktop/src/lib/design/styles/semantic/role.css interfaces/desktop/src/lib/design/styles/semantic/accent.css` → ≥2 hits (targets exist).

## FILES

1. `interfaces/desktop/src/lib/design/debug/TokenDebugOverlay.svelte` (~:508, :563, :567–:593)
2. `interfaces/desktop/src/lib/devtools/system/datastores/project-db/feature/ProjectDbDevtool.svelte`
3. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/DownloaderConfirmPanel.svelte`
4. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/DownloaderProgressPanel.svelte`
5. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/DownloaderTokenPanel.svelte`

(If a Downloader panel path differs, locate it by `grep -rln -- "--font-family-mono" interfaces/desktop/src/lib/domains/app/models` — the batch is exactly the files that grep returns for the downloader area; report actual paths.)

## STEPS

1. ALL five files: every `var(--font-family-mono` … `)` → `var(--font-mono)` (drop fallbacks).
2. File 1 only: every `var(--signal-error-fill)` → `var(--danger-fill)` (~:567, :590; expect 2).
3. File 1 only: every `var(--signal-error-main)` → `var(--signal-error)` (~:568, :569, :591, :593; expect 4).
4. File 1 only: every `var(--text-on-accent)` → `var(--accent-fg)` (~:563, :573; expect 2).

## IMPORT REPOINTS

None.

## VERIFY

- `grep -rn -- "--font-family-mono" interfaces/desktop/src --include="*.svelte" | grep -v "domains/app/ui-demo"` → 0 hits (ui-demo Glass* excluded — they retire in F8).
- `grep -rn -- "--signal-error-fill\|--signal-error-main\|--text-on-accent" interfaces/desktop/src --include="*.svelte"` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.

## KNOWN REDS

Sheet/Checkbox pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the five files>`

## STOP CONDITIONS

Downloader-panel grep returns ≠3 files in the models downloader area → STOP, report
the actual list before editing anything. Expected string absent → STOP + report.
