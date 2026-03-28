/**
 * @file Button Schema — Zod 4
 * @kind button
 *
 * Extends _base. Declares props + token consumption.
 * z.toJSONSchema() → A2UI catalog entry at build time.
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "interactive" as const;

export const ButtonSchema = baseComponentSchema.extend({
	variant: z
		.enum(["primary", "secondary", "ghost", "danger"])
		.default("primary")
		.describe("Visual variant. Maps to DTCG style token group."),
	size: z
		.enum(["sm", "md", "lg"])
		.default("md")
		.describe("Structural size. Controls height, padding, font-size."),
	child: z
		.string()
		.optional()
		.describe("ID of the child component. Use Text for labeled buttons, Icon for icon-only."),
	disabled: z.boolean().default(false).describe("Whether the button is disabled."),
	loading: z.boolean().default(false).describe("Whether the button shows a loading state."),
	action: z
		.object({
			event: z
				.object({
					name: z.string(),
					context: z.record(z.string(), z.unknown()).optional(),
				})
				.optional(),
			functionCall: z
				.object({
					call: z.string(),
					args: z.record(z.string(), z.unknown()),
				})
				.optional(),
		})
		.optional()
		.describe("Action dispatched on click."),
});

export type ButtonSchemaProps = z.infer<typeof ButtonSchema>;
