/**
 * @file Alert Component Barrel
 * @kind alert
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled alerts, import from ui/alert/.
 */

export { default as Alert } from "./Alert.svelte";
export { contract as alertComponentContract } from "./contract.js";
export { alertRecipe } from "./recipe.js";
export type { AlertComponentProps } from "./types.js";
