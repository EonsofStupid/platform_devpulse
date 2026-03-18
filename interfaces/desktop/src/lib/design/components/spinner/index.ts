/**
 * @file Spinner Component Barrel
 * @kind spinner
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled spinners, import from ui/spinner/.
 */

export { contract as spinnerComponentContract } from "./contract.js";
export { type SpinnerSize, spinnerRecipe } from "./recipe.js";
export { default as Spinner } from "./Spinner.svelte";
export type { SpinnerProps } from "./types.js";
