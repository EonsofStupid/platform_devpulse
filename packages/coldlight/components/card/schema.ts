/**
 * @file Card Schema — ArkType
 * @kind card
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { SURFACE_FAMILIES } from "#coldlight/renderforge/generated/surfaces.js";
import { baseComponentSchema } from "../_base/schema.js";
import { CARD_DEFAULTS, CARD_VARIANTS } from "./card.generated.js";

export const CATEGORY = "layout" as const;

export const CardSchema = baseComponentSchema
	.merge({
		as: type("'div' | 'a' | 'button'").default("div"),
		variant: type.enumerated(...CARD_VARIANTS).default(CARD_DEFAULTS.variant),
		"surface?": type.enumerated(...SURFACE_FAMILIES),
		orientation: type("'vertical' | 'horizontal'").default("vertical"),
		"label?": "string",
		"labelledBy?": "string",
		"href?": "string",
		disabled: type("boolean").default(false),
	})
	.describe("Card — container surface with interactive and layout variants");

export type CardSchemaProps = typeof CardSchema.infer;
