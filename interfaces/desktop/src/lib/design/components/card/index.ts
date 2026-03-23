/**
 * @file Card — public API
 * @kind card
 */

export { default as Card } from "./Card.svelte";
export { cardDef } from "./card.def.js";
export { CardSchema, CATEGORY, type CardSchemaProps } from "./schema.js";
export { cardTokens } from "./tokens.js";
export { cardRecipes } from "./composition.js";
export type { CardProps, CardVariant, CardAs, CardOrientation } from "./card.types.js";
