/**
 * @file Sidebar Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Sidebar primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SidebarSchema = {
	kind: "sidebar",
	engine: "coldlight",
	slots: ["root", "trigger", "header", "content", "footer"],
	states: ["expanded"],
	aria: ["aria-label", "aria-expanded", "aria-controls", "role"],
	interactions: ["click.trigger"],
} as const satisfies ComponentSchema;
