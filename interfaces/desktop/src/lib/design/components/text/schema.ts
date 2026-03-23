/**
 * @file Text Schema — Zod 4
 * @kind text
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "typography" as const;

export const TextSchema = baseComponentSchema.extend({
	as: z.enum(["span", "p", "div", "label", "strong", "em", "small"]).default("span").describe(
		"Semantic HTML element to render.",
	),
	size: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl"]).default("base").describe(
		"Text size. Controls font-size.",
	),
	weight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("normal").describe(
		"Font weight. Structural class.",
	),
});

export type TextSchemaProps = z.infer<typeof TextSchema>;
