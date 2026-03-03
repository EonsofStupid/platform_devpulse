/**
 * @file api/adapters/meltui/_internal/radiogroup/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI RadioGroup adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const RadioGroupSchema = {
	kind: "radiogroup",
	engine: "meltui",
	slots: ["root", "label", "hiddenInput"],
	states: ["value", "disabled"],
	aria: [
		"aria-required",
		"aria-labelledby",
		"aria-checked",
		"aria-hidden",
	],
	interactions: [
		"click",
		"keydown.arrowdown",
		"keydown.arrowup",
		"keydown.arrowleft",
		"keydown.arrowright",
	],
} as const satisfies ComponentSchema;
