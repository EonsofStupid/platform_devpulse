/**
 * @file StatusDot Schema — ArkType
 * @kind status-dot
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "feedback" as const;

export const StatusDotSchema = baseComponentSchema.and({
	status: type(
		"'online' | 'offline' | 'loading' | 'ready' | 'failed' | 'pending' | 'hybrid'",
	).default("pending"),
	size: type("'sm' | 'md' | 'lg'").default("md"),
	animate: type("boolean").default(false),
});

export type StatusDotSchemaProps = typeof StatusDotSchema.infer;
