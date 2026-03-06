/**
 * @file api/adapters/meltui/_internal/toggle/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Toggle adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ToggleSchema = {
	kind: "toggle",
	engine: "meltui",
	slots: ["trigger"],
	states: ["pressed", "disabled"],
	aria: ["aria-pressed"],
	interactions: ["click"],
} as const satisfies ComponentSchema;
