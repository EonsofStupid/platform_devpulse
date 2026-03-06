/**
 * @file api/adapters/meltui/_internal/accordion/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Accordion adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AccordionSchema = {
	kind: "accordion",
	engine: "meltui",
	slots: ["root", "item", "trigger", "content"],
	states: ["expanded", "collapsed", "disabled"],
	aria: ["aria-expanded", "aria-controls", "aria-labelledby", "aria-disabled"],
	interactions: ["click", "keydown"],
} as const satisfies ComponentSchema;
