/**
 * @file Text Component Barrel
 * @kind text
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled text, import from ui/text/.
 */

export { default as Text } from "./Text.svelte";
export { contract as textComponentContract } from "./contract.js";
export { textRecipe } from "./recipe.js";
export type { TextComponentProps, TextSize, TextWeight, TextColor, TextAs } from "./types.js";
