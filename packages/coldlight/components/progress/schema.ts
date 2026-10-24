/**
 * @file Progress Schema — ArkType
 * @kind progress
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "feedback" as const;

export const ProgressSchema = baseComponentSchema
	.merge({
		value: type("number | null").default(0),
		min: type("number").default(0),
		max: type("number").default(100),
		size: type("'sm' | 'md' | 'lg'").default("md"),
	})
	.describe("Progress — determinate or indeterminate task completion indicator");

export type ProgressSchemaProps = typeof ProgressSchema.infer;
