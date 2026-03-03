/**
 * @file InlineMessage Component Barrel
 * @kind inline-message
 * @layer components
 *
 * Components layer — ARIA + behavioral. ZERO visual.
 * For styled inline-message, import from ui/inline-message/.
 */

export { default as InlineMessage } from "./InlineMessage.svelte";
export { contract as inlineMessageComponentContract } from "./contract.js";
export { inlineMessageRecipe } from "./recipe.js";
export type { InlineMessageComponentProps, InlineMessageTone } from "./types.js";
