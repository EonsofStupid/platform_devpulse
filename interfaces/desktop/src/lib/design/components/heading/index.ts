/**
 * @file Heading Component Barrel
 * @kind heading
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled headings, import from ui/heading/.
 */

export { default as Heading } from "./Heading.svelte";
export { contract as headingComponentContract } from "./contract.js";
export { headingRecipe } from "./recipe.js";
export type { HeadingComponentProps, HeadingLevel, HeadingSize } from "./types.js";
