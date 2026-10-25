/**
 * @file api/adapters/meltui/_internal/progress/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Progress adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ProgressSchema = {
	kind: "progress",
	engine: "meltui",
	slots: ["root", "progress"],
	states: ["indeterminate", "complete"],
	aria: ["aria-valuemin", "aria-valuemax", "aria-valuenow"],
	interactions: [],
} as const satisfies ComponentSchema;
