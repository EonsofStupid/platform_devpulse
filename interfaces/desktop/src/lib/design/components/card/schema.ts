/**
 * @file Card Schema — Zod 4
 * @kind card
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "layout" as const;

export const CardSchema = baseComponentSchema.extend({
	as: z.enum(["div", "a", "button"]).default("div").describe(
		"Element to render — div (default), anchor (link), or button (clickable).",
	),
	variant: z.enum(["default", "outlined", "elevated", "ghost", "glow"]).default("default").describe(
		"Visual variant. Maps to DTCG style token group.",
	),
	orientation: z.enum(["vertical", "horizontal"]).default("vertical").describe(
		"Layout direction — vertical (column) or horizontal (row).",
	),
	label: z.string().optional().describe(
		"Accessible label for the card.",
	),
	labelledBy: z.string().optional().describe(
		"ID of element that labels this card.",
	),
	href: z.string().optional().describe(
		"Link href when as='a'.",
	),
	disabled: z.boolean().default(false).describe(
		"Disabled state for interactive cards.",
	),
});

export type CardSchemaProps = z.infer<typeof CardSchema>;
