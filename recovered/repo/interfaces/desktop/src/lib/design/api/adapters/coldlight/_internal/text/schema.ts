/**
 * @file Text Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Text primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Text is a presentational typography wrapper with role="none".
 * No states, no interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TextSchema = {
	kind: "text",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: ["role"],
	interactions: [],
} as const satisfies ComponentSchema;
