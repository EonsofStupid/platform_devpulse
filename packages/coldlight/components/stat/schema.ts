/**
 * @file Stat Schema — ArkType
 * @kind stat
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "data-display" as const;

export const StatSchema = baseComponentSchema
	.merge({
		"value?": "string | number",
		"label?": "string",
		"unit?": "string",
		size: type("'sm' | 'md' | 'lg'").default("md"),
		accent: type("'teal' | 'purple' | 'ember' | 'cyber'").default("teal"),
	})
	.describe("Stat — metric display with value, label, and accent glow");

export type StatSchemaProps = typeof StatSchema.infer;
