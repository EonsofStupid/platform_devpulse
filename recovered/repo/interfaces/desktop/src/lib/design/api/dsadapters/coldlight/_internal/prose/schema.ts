/**
 * @file Prose Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Prose primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 * Prose is a display-only container — no ARIA roles, no interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ProseSchema = {
	kind: "prose",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
