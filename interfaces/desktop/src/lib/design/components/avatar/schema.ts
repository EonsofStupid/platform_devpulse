/**
 * @file Avatar Schema — Zod 4
 * @kind avatar
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "display" as const;

export const AvatarSchema = baseComponentSchema.extend({
	src: z.string().optional().describe("Image source URL."),
	alt: z.string().describe("Alt text for the image. Required for accessibility."),
	fallback: z
		.string()
		.optional()
		.describe("Fallback text when image fails. Default: first letter of alt."),
	size: z.number().default(40).describe("Size in pixels. Default: 40."),
});

export type AvatarSchemaProps = z.infer<typeof AvatarSchema>;
