/**
 * @file Button Component Barrel
 * @kind button
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled buttons, import from ui/button/.
 */

export { default as Button } from "./Button.svelte";
export { contract as buttonComponentContract } from "./contract.js";
export { buttonRecipe, type ButtonSize } from "./recipe.js";
export type { ButtonComponentProps } from "./types.js";
