/**
 * @file Spinner Component Barrel
 * @kind spinner
 * @layer components
 *
 * The canonical loading-indicator family. Three public entry points,
 * every consumer picks one:
 *
 * - `<Spinner />`      — raw indeterminate indicator. Use for inline
 *                        icon-sized decorations and as a building
 *                        block for higher-level surfaces.
 * - `<SpinnerRow />`   — spinner + label inline. The most common
 *                        "X is happening" strip. Replaces every
 *                        hand-rolled `Loader2 + text` pairing.
 * - `<LoadingBlock />` — centered spinner + title + subtitle +
 *                        optional DYK/KDROPS/T&T rotation. The
 *                        canonical in-container "please wait" panel.
 *
 * Full-screen block is `$lib/design/components/loading-overlay/
 * LoadingOverlay.svelte`, which composes `<Spinner />` internally —
 * not a separate spinner pipeline.
 *
 * **Do not import `Loader2` or `LoaderCircle` from `lucide-svelte`
 * in consumer code.** The `no-raw-values` pre-commit hook rejects
 * those imports outside this folder. Add a new `tone` to
 * `SpinnerTone` if you need a color not already covered.
 */

export { default as LoadingBlock } from "./LoadingBlock.svelte";
export { default as Spinner } from "./Spinner.svelte";
export { default as SpinnerRow } from "./SpinnerRow.svelte";
export type { SpinnerPreset, SpinnerProps, SpinnerSize, SpinnerTone } from "./types.js";
