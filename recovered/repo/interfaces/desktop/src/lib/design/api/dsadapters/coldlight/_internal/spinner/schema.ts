/**
 * @file Spinner Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Spinner primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Spinner is a non-interactive status indicator with live-region semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SpinnerSchema = {
	kind: "spinner",
	engine: "coldlight",
	slots: ["root"],
	states: ["active"],
	aria: ["role", "aria-label", "aria-hidden"],
	interactions: [],
} as const satisfies ComponentSchema;
