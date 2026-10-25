/**
 * @file Steps Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Steps primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Steps provides multi-step navigation with aria-current="step"
 * on the active step and click-to-navigate interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const StepsSchema = {
	kind: "steps",
	engine: "coldlight",
	slots: ["root", "step"],
	states: ["disabled"],
	aria: ["role", "aria-label", "aria-current", "aria-disabled"],
	interactions: ["click"],
} as const satisfies ComponentSchema;
