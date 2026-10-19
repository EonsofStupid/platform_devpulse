/**
 * @file Avatar Schema — ArkType
 * @kind avatar
 *
 * Extends _base. Declares props + token consumption.
 * .toJsonSchema() → A2UI catalog entry at build time.
 */

import { type } from "arktype";
import { baseComponentSchema } from "../_base/schema.js";

export const CATEGORY = "display" as const;

export const AvatarSchema = baseComponentSchema
	.merge({
		"src?": "string",
		alt: "string",
		"fallback?": "string",
		size: type("number").default(40),
	})
	.describe("Avatar — user image with fallback initials");

export type AvatarSchemaProps = typeof AvatarSchema.infer;
