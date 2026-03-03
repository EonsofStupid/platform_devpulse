/**
 * @file Toolbar Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Toolbar primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Toolbar provides role="toolbar" with roving tabindex and arrow-key
 * navigation between toolbar items.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ToolbarSchema = {
	kind: "toolbar",
	engine: "coldlight",
	slots: ["root", "item"],
	states: ["disabled"],
	aria: [
		"role",
		"aria-orientation",
		"aria-label",
		"aria-disabled",
	],
	interactions: [
		"click",
		"keydown.arrowleft",
		"keydown.arrowright",
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.home",
		"keydown.end",
		"focus",
	],
} as const satisfies ComponentSchema;
