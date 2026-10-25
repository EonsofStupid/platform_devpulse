/**
 * @file Switch Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Switch primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Switch is a fully interactive toggle widget with role="switch",
 * aria-checked, keyboard (Space/Enter), and click-to-toggle.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SwitchSchema = {
	kind: "switch",
	engine: "coldlight",
	slots: ["root", "thumb", "label"],
	states: ["checked", "disabled", "required"],
	aria: [
		"role",
		"aria-checked",
		"aria-disabled",
		"aria-required",
		"aria-label",
		"aria-labelledby",
		"aria-describedby",
		"aria-hidden",
	],
	interactions: ["click", "keydown.space", "keydown.enter"],
} as const satisfies ComponentSchema;
