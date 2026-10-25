/**
 * @file api/adapters/meltui/_internal/accordion/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Accordion adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AccordionSchema = {
	kind: "accordion",
	engine: "meltui",
	slots: ["root", "heading", "trigger", "content"],
	states: ["disabled", "expanded"],
	aria: [
		"aria-expanded",
		"aria-controls",
		"aria-disabled",
		"aria-level",
		"aria-labelledby",
	],
	interactions: [
		"click",
		"keydown.space",
		"keydown.enter",
		"keydown.arrowdown",
		"keydown.arrowup",
		"keydown.home",
		"keydown.end",
	],
} as const satisfies ComponentSchema;
