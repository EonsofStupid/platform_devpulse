/**
 * @file Sheet Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Sheet primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SheetSchema = {
	kind: "sheet",
	engine: "coldlight",
	slots: ["trigger", "overlay", "content", "close"],
	states: ["open"],
	aria: [
		"aria-haspopup",
		"aria-expanded",
		"aria-controls",
		"aria-modal",
		"aria-label",
		"aria-hidden",
		"role",
	],
	interactions: [
		"click.trigger",
		"click.overlay",
		"click.close",
		"keydown.escape",
	],
} as const satisfies ComponentSchema;
