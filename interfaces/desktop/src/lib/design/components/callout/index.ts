/**
 * @file Callout Component Barrel
 * @kind callout
 * @layer components
 *
 * Components layer — ARIA + state. ZERO visual.
 * For styled callout, import from ui/callout/.
 */

export { default as Callout } from "./Callout.svelte";
export { contract as calloutComponentContract } from "./contract.js";
export { calloutRecipe } from "./recipe.js";
export type { CalloutComponentProps, CalloutVariant } from "./types.js";
