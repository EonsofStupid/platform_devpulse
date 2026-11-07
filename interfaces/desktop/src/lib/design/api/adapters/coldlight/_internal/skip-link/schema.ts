/**
 * @file SkipLink Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the SkipLink primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SkipLinkSchema = {
	kind: "skip-link",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: ["aria-label"],
	interactions: ["click"],
} as const satisfies ComponentSchema;
