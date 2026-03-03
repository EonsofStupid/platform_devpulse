/**
 * @file api/adapters/meltui/_internal/tabs/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Tabs adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TabsSchema = {
	kind: "tabs",
	engine: "meltui",
	slots: ["triggerList"],
	states: ["value"],
	aria: [
		"aria-orientation",
		"aria-selected",
		"aria-controls",
		"aria-labelledby",
	],
	interactions: [
		"click",
		"keydown.arrowleft",
		"keydown.arrowright",
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.home",
		"keydown.end",
	],
} as const satisfies ComponentSchema;
