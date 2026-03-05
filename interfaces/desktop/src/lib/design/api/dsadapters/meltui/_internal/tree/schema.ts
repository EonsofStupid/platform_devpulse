/**
 * @file api/adapters/meltui/_internal/tree/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Tree adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TreeSchema = {
	kind: "tree",
	engine: "meltui",
	slots: ["root", "group"],
	states: ["selected", "expanded"],
	aria: [
		"aria-selected",
		"aria-expanded",
		"data-selected",
	],
	interactions: [
		"click",
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.arrowleft",
		"keydown.arrowright",
		"keydown.home",
		"keydown.end",
		"keydown.enter",
		"keydown.space",
	],
} as const satisfies ComponentSchema;
