/**
 * @file Nav Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Nav primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const NavSchema = {
	kind: "nav",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: ["aria-label", "role"],
	interactions: [],
} as const satisfies ComponentSchema;
