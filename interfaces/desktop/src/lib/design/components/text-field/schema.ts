/**
 * @file TextField Schema — Zod 4
 * @kind text-field
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "interactive" as const;

export const TextFieldSchema = baseComponentSchema.extend({
	label: z.string().optional().describe(
		"Label text — rendered above the input.",
	),
	description: z.string().optional().describe(
		"Description text — rendered below the input.",
	),
	error: z.string().optional().describe(
		"Error message — shown when invalid.",
	),
	type: z.enum(["text", "email", "password", "url", "tel"]).default("text").describe(
		"Input type.",
	),
	placeholder: z.string().optional().describe(
		"Placeholder text.",
	),
	size: z.enum(["sm", "md", "lg"]).default("md").describe(
		"Structural size. Controls height, padding, font-size.",
	),
	disabled: z.boolean().default(false).describe("Whether the field is disabled."),
	readonly: z.boolean().default(false).describe("Whether the field is read-only."),
	required: z.boolean().default(false).describe("Whether the field is required."),
	invalid: z.boolean().default(false).describe("Whether the field is in an invalid state."),
});

export type TextFieldSchemaProps = z.infer<typeof TextFieldSchema>;
