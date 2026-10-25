/**
 * @file NavItem Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the NavItem primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const NavItemSchema = {
	kind: "nav-item",
	engine: "coldlight",
	slots: ["root"],
	states: ["active", "disabled"],
	aria: ["aria-current", "aria-disabled"],
	interactions: [],
} as const satisfies ComponentSchema;
