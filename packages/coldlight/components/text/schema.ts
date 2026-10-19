/**
 * @file Text Schema — ArkType
 * @kind text
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "typography" as const;

export const TextSchema = baseComponentSchema
	.merge({
		as: type("'span' | 'p' | 'div' | 'label' | 'strong' | 'em' | 'small'").default("span"),
		size: type("'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'").default("base"),
		weight: type("'light' | 'normal' | 'medium' | 'semibold' | 'bold'").default("normal"),
	})
	.describe("Text — typography primitive with semantic element and size control");

export type TextSchemaProps = typeof TextSchema.infer;
