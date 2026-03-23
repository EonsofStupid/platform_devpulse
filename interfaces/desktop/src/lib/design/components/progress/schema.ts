/**
 * @file Progress Schema — Zod 4
 * @kind progress
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "feedback" as const;

export const ProgressSchema = baseComponentSchema.extend({
	value: z.number().nullable().default(0).describe(
		"Current value. null = indeterminate.",
	),
	min: z.number().default(0).describe(
		"Minimum value.",
	),
	max: z.number().default(100).describe(
		"Maximum value.",
	),
	size: z.enum(["sm", "md", "lg"]).default("md").describe(
		"Structural size. Controls track height.",
	),
});

export type ProgressSchemaProps = z.infer<typeof ProgressSchema>;
