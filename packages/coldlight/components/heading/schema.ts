/**
 * @file Heading Schema — ArkType
 * @kind heading
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "typography" as const;

export const HeadingSchema = baseComponentSchema
	.merge({
		level: type("1 | 2 | 3 | 4 | 5 | 6").default(2),
		size: type("'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'").default("lg"),
	})
	.describe("Heading — semantic heading level with independent visual size");

export type HeadingSchemaProps = typeof HeadingSchema.infer;
