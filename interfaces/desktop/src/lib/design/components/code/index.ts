/**
 * @file Code Component Barrel
 * @kind code
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled code, import from ui/code/.
 */

export { default as Code } from "./Code.svelte";
export { contract as codeComponentContract } from "./contract.js";
export { codeRecipe } from "./recipe.js";
export type { CodeComponentProps, CodeLanguage } from "./types.js";
