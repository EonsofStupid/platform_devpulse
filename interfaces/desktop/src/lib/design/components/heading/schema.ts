/**
 * @file Heading Schema — Zod 4
 * @kind heading
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "typography" as const;

export const HeadingSchema = baseComponentSchema.extend({
	level: z
		.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)])
		.default(2)
		.describe("Heading level (1-6). Maps to semantic h1-h6 element."),
	size: z
		.enum(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"])
		.default("lg")
		.describe("Structural size. Controls font-size independent of level."),
});

export type HeadingSchemaProps = z.infer<typeof HeadingSchema>;
