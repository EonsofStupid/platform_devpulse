/**
 * @file Sticky Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Sticky primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Sticky is a layout-only builder — no ARIA, no states, no interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const StickySchema = {
	kind: "sticky",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
