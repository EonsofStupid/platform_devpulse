/**
 * @file api/adapters/meltui/_internal/dialog/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI Dialog adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const DialogSchema = {
	kind: "dialog",
	engine: "meltui",
	slots: ["trigger", "content", "overlay"],
	states: ["open"],
	aria: ["aria-modal", "aria-haspopup", "aria-hidden"],
	interactions: [
		"click",
		"keydown.escape",
	],
} as const satisfies ComponentSchema;
