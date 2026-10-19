/**
 * @file Text — public API
 * @kind text
 */

export { CATEGORY, TextSchema, type TextSchemaProps } from "./schema.js";
export { default as Text } from "./Text.svelte";
export type { TextAs, TextPreset, TextProps, TextSize, TextWeight } from "./text.types.js";
export { textSizeTokens, textTokens } from "./tokens.js";
