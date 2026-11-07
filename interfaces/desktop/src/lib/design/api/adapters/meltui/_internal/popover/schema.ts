/**
 * @file api/adapters/meltui/_internal/popover/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Popover adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const PopoverSchema = {
	kind: "popover",
	engine: "meltui",
	slots: ["trigger", "content", "arrow"],
	states: ["open"],
	aria: ["aria-hidden"],
	interactions: [
		"click",
		"keydown.escape",
		"focus",
		"focusout",
	],
} as const satisfies ComponentSchema;
