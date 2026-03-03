/**
 * @file List Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the List primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ListSchema = {
	kind: "list",
	engine: "coldlight",
	slots: ["root", "item"],
	states: [],
	aria: ["aria-label", "role"],
	interactions: [],
} as const satisfies ComponentSchema;
