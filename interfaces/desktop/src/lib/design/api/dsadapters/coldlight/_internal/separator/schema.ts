/**
 * @file Separator Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Separator primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 * Separators are non-interactive structural elements.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SeparatorSchema = {
	kind: "separator",
	engine: "coldlight",
	slots: ["root"],
	states: ["decorative"],
	aria: ["aria-orientation", "aria-hidden", "role"],
	interactions: [],
} as const satisfies ComponentSchema;
