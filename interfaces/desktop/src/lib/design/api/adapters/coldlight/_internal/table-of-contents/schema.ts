/**
 * @file TableOfContents Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the TableOfContents primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * TableOfContents is a navigation landmark with active heading tracking
 * via aria-current="location".
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TableOfContentsSchema = {
	kind: "table-of-contents",
	engine: "coldlight",
	slots: ["root", "list", "item"],
	states: [],
	aria: ["role", "aria-label", "aria-current"],
	interactions: [],
} as const satisfies ComponentSchema;
