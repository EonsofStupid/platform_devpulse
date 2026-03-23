/**
 * @file Stat — public API
 * @kind stat
 */

export { default as Stat } from "./Stat.svelte";
export { StatSchema, CATEGORY, type StatSchemaProps } from "./schema.js";
export { statTokens, statSizeTokens } from "./tokens.js";
export { statRecipes } from "./composition.js";
export type { StatProps, StatSize } from "./stat.types.js";
