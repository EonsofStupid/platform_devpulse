/**
 * @file Kbd Component Barrel
 * @kind kbd
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled kbd, import from ui/kbd/.
 */

export { default as Kbd } from "./Kbd.svelte";
export { contract as kbdComponentContract } from "./contract.js";
export { kbdRecipe } from "./recipe.js";
export type { KbdComponentProps, KbdSize } from "./types.js";
