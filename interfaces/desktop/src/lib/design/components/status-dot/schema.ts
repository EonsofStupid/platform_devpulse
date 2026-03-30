/**
 * @file StatusDot Schema — ArkType
 * @kind status-dot
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "feedback" as const;

export const StatusDotSchema = baseComponentSchema
	.merge({
		status: type(
			"'online' | 'offline' | 'loading' | 'ready' | 'failed' | 'pending' | 'hybrid'",
		).default("pending"),
		size: type("'sm' | 'md' | 'lg'").default("md"),
		animate: type("boolean").default(false),
	})
	.describe("StatusDot — connection/process status indicator with animation");

export type StatusDotSchemaProps = typeof StatusDotSchema.infer;
