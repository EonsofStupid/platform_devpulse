/**
 * @file api/adapters/meltui/_internal/collapsible/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Collapsible adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CollapsibleSchema = {
	kind: "collapsible",
	engine: "meltui",
	slots: ["trigger", "content"],
	states: ["open", "disabled"],
	aria: ["aria-expanded", "aria-controls"],
	interactions: ["click"],
} as const satisfies ComponentSchema;
