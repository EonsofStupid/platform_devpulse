/**
 * @file api/adapters/meltui/_internal/avatar/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Avatar adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AvatarSchema = {
	kind: "avatar",
	engine: "meltui",
	slots: ["image", "fallback"],
	states: ["loading", "loaded", "error"],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
