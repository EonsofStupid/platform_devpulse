/**
 * @file api/adapters/meltui/_internal/tooltip/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Tooltip adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TooltipSchema = {
	kind: "tooltip",
	engine: "meltui",
	slots: ["trigger", "content", "arrow"],
	states: ["open"],
	aria: [
		"aria-describedby",
		"aria-hidden",
	],
	interactions: [
		"pointerenter",
		"pointerleave",
		"pointerdown",
		"pointermove",
		"focus",
		"blur",
		"focusout",
	],
} as const satisfies ComponentSchema;
