/**
 * @file api/adapters/meltui/_internal/pininput/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI PinInput adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const PinInputSchema = {
	kind: "pin-input",
	engine: "meltui",
	slots: ["root", "input"],
	states: ["disabled", "filled"],
	aria: [],
	interactions: [
		"keydown",
		"input",
		"focus",
		"blur",
		"paste",
		"pointerdown",
		"pointerup",
	],
} as const satisfies ComponentSchema;
