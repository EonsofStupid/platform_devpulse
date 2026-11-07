/**
 * @file Skeleton Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Skeleton primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 * Skeletons are non-interactive placeholder indicators.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SkeletonSchema = {
	kind: "skeleton",
	engine: "coldlight",
	slots: ["root"],
	states: ["loading"],
	aria: ["aria-busy", "aria-label", "role"],
	interactions: [],
} as const satisfies ComponentSchema;
