/**
 * @file api/adapters/meltui/_internal/toaster/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Toaster adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ToasterSchema = {
	kind: "toaster",
	engine: "meltui",
	slots: ["root"],
	states: ["active"],
	aria: [
		"aria-live",
		"aria-labelledby",
		"aria-describedby",
	],
	interactions: [
		"click",
		"pointerenter",
		"pointerleave",
	],
} as const satisfies ComponentSchema;
