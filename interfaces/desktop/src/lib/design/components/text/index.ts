/**
 * @file Text — public API
 * @kind text
 */

export { default as Text } from "./Text.svelte";
export { textDef } from "./text.def.js";
export { TextSchema, CATEGORY, type TextSchemaProps } from "./schema.js";
export { textTokens, textSizeTokens } from "./tokens.js";
export { textRecipes } from "./composition.js";
export type { TextProps, TextAs, TextSize, TextWeight } from "./text.types.js";
