/**
 * @file Spinner Component Barrel
 * @kind spinner
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled spinners, import from ui/spinner/.
 */

export { default as Spinner } from "./Spinner.svelte";
export { contract as spinnerComponentContract } from "./contract.js";
export { spinnerRecipe, type SpinnerSize } from "./recipe.js";
export type { SpinnerComponentProps } from "./types.js";
