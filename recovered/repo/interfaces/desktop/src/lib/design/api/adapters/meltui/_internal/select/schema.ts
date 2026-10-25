/**
 * @file api/adapters/meltui/_internal/select/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Select adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SelectSchema = {
	kind: "select",
	engine: "meltui",
	slots: ["label", "trigger", "content"],
	states: ["open", "value", "highlighted"],
	aria: [
		"aria-expanded",
		"aria-haspopup",
		"aria-controls",
		"aria-owns",
		"aria-activedescendant",
		"aria-selected",
		"aria-hidden",
	],
	interactions: [
		"click",
		"keydown",
		"mouseover",
	],
} as const satisfies ComponentSchema;
