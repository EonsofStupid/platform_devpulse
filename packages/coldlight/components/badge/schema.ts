/**
 * @file Badge Schema — ArkType
 * @kind badge
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "status" as const;

export const BadgeSchema = baseComponentSchema
	.merge({
		variant: type(
			"'neutral' | 'accent' | 'informative' | 'positive' | 'notice' | 'negative'",
		).default("neutral"),
		fillStyle: type("'bold' | 'subtle' | 'outline'").default("bold"),
		size: type("'sm' | 'md' | 'lg' | 'xl'").default("md"),
		overflowMode: type("'wrap' | 'truncate'").default("wrap"),
		decorative: type("boolean").default(false),
	})
	.describe("Badge — semantic status label with color variants");

export type BadgeSchemaProps = typeof BadgeSchema.infer;
