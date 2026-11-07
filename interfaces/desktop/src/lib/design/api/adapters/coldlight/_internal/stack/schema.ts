/**
 * @file Stack Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Stack primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Stack is a layout-only builder — no ARIA, no states, no interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const StackSchema = {
	kind: "stack",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
