/**
 * @file Tabs Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Tabs primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Tabs implements the WAI-ARIA tabs pattern: tablist, tab, tabpanel
 * with roving tabindex and arrow-key navigation.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TabsSchema = {
	kind: "tabs",
	engine: "coldlight",
	slots: ["root", "list", "trigger", "content"],
	states: [],
	aria: [
		"role",
		"aria-selected",
		"aria-controls",
		"aria-labelledby",
		"aria-orientation",
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
	],
} as const satisfies ComponentSchema;
