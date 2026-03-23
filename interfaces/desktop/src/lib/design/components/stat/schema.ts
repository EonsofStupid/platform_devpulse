/**
 * @file Stat Schema — Zod 4
 * @kind stat
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "data-display" as const;

export const StatSchema = baseComponentSchema.extend({
	value: z.union([z.string(), z.number()]).optional().describe("The metric value."),
	label: z.string().optional().describe("Label for the metric."),
	unit: z.string().optional().describe("Unit suffix (%, ms, GB)."),
	size: z.enum(["sm", "md", "lg"]).default("md").describe("Size variant."),
	accent: z.enum(["teal", "purple", "ember", "cyber"]).default("teal").describe("Accent color for glow."),
});

export type StatSchemaProps = z.infer<typeof StatSchema>;
