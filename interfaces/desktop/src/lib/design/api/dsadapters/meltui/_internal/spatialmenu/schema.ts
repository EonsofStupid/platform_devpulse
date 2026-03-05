/**
 * @file api/adapters/meltui/_internal/spatialmenu/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI SpatialMenu adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SpatialMenuSchema = {
	kind: "spatialmenu",
	engine: "meltui",
	slots: ["root", "input"],
	states: ["highlighted"],
	aria: [
		"data-highlighted",
		"data-disabled",
	],
	interactions: [
		"click",
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.arrowleft",
		"keydown.arrowright",
		"mousemove",
	],
} as const satisfies ComponentSchema;
