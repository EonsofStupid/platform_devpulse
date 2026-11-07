/**
 * @file Spacer Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Spacer primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Spacer is purely presentational — no states, no interactions.
 * Always hidden from the accessibility tree via aria-hidden.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SpacerSchema = {
	kind: "spacer",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: ["aria-hidden"],
	interactions: [],
} as const satisfies ComponentSchema;
