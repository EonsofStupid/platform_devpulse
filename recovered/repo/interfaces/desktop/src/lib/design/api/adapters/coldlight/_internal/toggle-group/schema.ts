/**
 * @file ToggleGroup Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the ToggleGroup primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * ToggleGroup provides role="group" with aria-pressed toggle items,
 * roving tabindex, and arrow-key navigation. Supports single and multi-select.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ToggleGroupSchema = {
	kind: "toggle-group",
	engine: "coldlight",
	slots: ["root", "item"],
	states: ["disabled"],
	aria: [
		"role",
		"aria-orientation",
		"aria-pressed",
		"aria-disabled",
	],
	interactions: [
		"click",
		"keydown.space",
		"keydown.enter",
		"keydown.arrowleft",
		"keydown.arrowright",
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.home",
		"keydown.end",
	],
} as const satisfies ComponentSchema;
