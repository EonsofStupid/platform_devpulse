/**
 * @file ScrollArea Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the ScrollArea primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ScrollAreaSchema = {
	kind: "scroll-area",
	engine: "coldlight",
	slots: ["root", "viewport", "scrollbar", "thumb"],
	states: [],
	aria: [
		"aria-label",
		"aria-controls",
		"aria-orientation",
		"aria-valuemin",
		"aria-valuemax",
		"aria-valuenow",
		"role",
	],
	interactions: [],
} as const satisfies ComponentSchema;
