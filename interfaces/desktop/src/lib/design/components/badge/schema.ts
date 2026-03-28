/**
 * @file Badge Schema — Zod 4
 * @kind badge
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "status" as const;

export const BadgeSchema = baseComponentSchema.extend({
	variant: z
		.enum(["neutral", "accent", "informative", "positive", "notice", "negative"])
		.default("neutral")
		.describe("Semantic color variant. Maps to DTCG style token group."),
	fillStyle: z
		.enum(["bold", "subtle", "outline"])
		.default("bold")
		.describe("Fill style — bold, subtle background, or outline only."),
	size: z
		.enum(["sm", "md", "lg", "xl"])
		.default("md")
		.describe("Structural size. Controls padding and font-size."),
	overflowMode: z.enum(["wrap", "truncate"]).default("wrap").describe("Text overflow behavior."),
	decorative: z
		.boolean()
		.default(false)
		.describe("Whether the badge is purely decorative (aria-hidden)."),
});

export type BadgeSchemaProps = z.infer<typeof BadgeSchema>;
