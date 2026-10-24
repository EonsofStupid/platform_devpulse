/**
 * @file TextField Schema — ArkType
 * @kind text-field
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "interactive" as const;

export const TextFieldSchema = baseComponentSchema
	.merge({
		"label?": "string",
		"description?": "string",
		"error?": "string",
		type: type("'text' | 'email' | 'password' | 'url' | 'tel'").default("text"),
		"placeholder?": "string",
		size: type("'sm' | 'md' | 'lg'").default("md"),
		disabled: type("boolean").default(false),
		readonly: type("boolean").default(false),
		required: type("boolean").default(false),
		invalid: type("boolean").default(false),
	})
	.describe("TextField — labeled text input with validation states");

export type TextFieldSchemaProps = typeof TextFieldSchema.infer;
