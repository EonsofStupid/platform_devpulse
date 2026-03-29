/**
 * @file Button Schema — ArkType
 * @kind button
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "interactive" as const;

export const ButtonSchema = baseComponentSchema.and({
	variant: type("'primary' | 'secondary' | 'ghost' | 'danger'").default("primary"),
	size: type("'sm' | 'md' | 'lg'").default("md"),
	"child?": "string",
	disabled: type("boolean").default(false),
	loading: type("boolean").default(false),
	"action?": type({
		"event?": type({
			name: "string",
			"context?": "Record<string, unknown>",
		}),
		"functionCall?": type({
			call: "string",
			args: "Record<string, unknown>",
		}),
	}),
});

export type ButtonSchemaProps = typeof ButtonSchema.infer;
