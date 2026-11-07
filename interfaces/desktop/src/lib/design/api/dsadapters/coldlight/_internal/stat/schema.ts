/**
 * @file Stat Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Stat primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Stat groups label + value + helptext into a semantic unit
 * via role="group" with aria-label or aria-labelledby.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const StatSchema = {
	kind: "stat",
	engine: "coldlight",
	slots: ["root", "label", "value", "helptext"],
	states: [],
	aria: ["role", "aria-label", "aria-labelledby"],
	interactions: [],
} as const satisfies ComponentSchema;
