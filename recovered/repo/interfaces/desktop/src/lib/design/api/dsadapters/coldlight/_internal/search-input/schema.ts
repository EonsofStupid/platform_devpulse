/**
 * @file SearchInput Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the SearchInput primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SearchInputSchema = {
	kind: "search-input",
	engine: "coldlight",
	slots: ["root", "input", "icon", "clear"],
	states: ["disabled"],
	aria: ["aria-label", "aria-describedby", "aria-disabled", "aria-hidden", "role"],
	interactions: ["keydown.escape", "input", "click.clear"],
} as const satisfies ComponentSchema;
