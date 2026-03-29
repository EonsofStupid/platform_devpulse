/**
 * @file Card Schema — ArkType
 * @kind card
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "layout" as const;

export const CardSchema = baseComponentSchema.and({
	as: type("'div' | 'a' | 'button'").default("div"),
	variant: type("'default' | 'outlined' | 'elevated' | 'ghost' | 'glow'").default("default"),
	orientation: type("'vertical' | 'horizontal'").default("vertical"),
	"label?": "string",
	"labelledBy?": "string",
	"href?": "string",
	disabled: type("boolean").default(false),
});

export type CardSchemaProps = typeof CardSchema.infer;
