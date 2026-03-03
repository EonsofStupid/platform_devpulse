/**
 * @file api/adapters/meltui/_internal/slider/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Slider adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SliderSchema = {
	kind: "slider",
	engine: "meltui",
	slots: ["root", "thumb"],
	states: ["value"],
	aria: [
		"aria-valuenow",
		"aria-valuemin",
		"aria-valuemax",
		"aria-orientation",
	],
	interactions: [
		"pointerdown",
		"keydown.arrowleft",
		"keydown.arrowright",
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.home",
		"keydown.end",
	],
} as const satisfies ComponentSchema;
