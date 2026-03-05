/**
 * @file api/adapters/meltui/_internal/combobox/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Combobox adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ComboboxSchema = {
	kind: "combobox",
	engine: "meltui",
	slots: ["label", "input", "trigger", "content", "option"],
	states: ["open", "highlighted"],
	aria: [
		"aria-expanded",
		"aria-controls",
		"aria-owns",
		"aria-activedescendant",
		"aria-selected",
		"aria-hidden",
	],
	interactions: [
		"click",
		"keydown.arrowdown",
		"keydown.arrowup",
		"keydown.enter",
		"keydown.escape",
		"keydown.home",
		"keydown.end",
		"input",
		"focus",
		"focusout",
		"mouseover",
	],
} as const satisfies ComponentSchema;
