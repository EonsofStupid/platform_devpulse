/**
 * @file LoadingOverlay Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the LoadingOverlay primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const LoadingOverlaySchema = {
	kind: "loading-overlay",
	engine: "coldlight",
	slots: ["root", "spinner", "label"],
	states: ["visible"],
	aria: ["aria-busy", "aria-label", "aria-hidden", "role"],
	interactions: [],
} as const satisfies ComponentSchema;
