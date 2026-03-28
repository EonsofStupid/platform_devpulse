/**
 * @file StatusDot Schema — Zod 4
 * @kind status-dot
 */

import { z } from "zod";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "feedback" as const;

export const StatusDotSchema = baseComponentSchema.extend({
	status: z
		.enum(["online", "offline", "loading", "ready", "failed", "pending", "hybrid"])
		.default("pending")
		.describe("Current status. Drives color + glow from tokens."),
	size: z.enum(["sm", "md", "lg"]).default("md").describe("Dot size."),
	animate: z.boolean().default(false).describe("Pulse animation for loading states."),
});

export type StatusDotSchemaProps = z.infer<typeof StatusDotSchema>;
