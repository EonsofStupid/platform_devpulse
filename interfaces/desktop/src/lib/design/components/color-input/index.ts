/**
 * @file Color Input Component Barrel
 * @kind color-input
 * @layer components
 */

export { default as ColorInput } from "./ColorInput.svelte";
export { contract as colorInputComponentContract } from "./contract.js";
export {
	colorInputInputRecipe,
	colorInputLabelRecipe,
	colorInputRecipe,
	colorInputSwatchRecipe,
} from "./recipe.js";
export type { ColorInputComponentProps, ColorInputSize } from "./types.js";
