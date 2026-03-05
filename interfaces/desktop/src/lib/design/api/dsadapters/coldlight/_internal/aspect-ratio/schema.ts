/**
 * @file AspectRatio Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * AspectRatio is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root.
 * States: (none — pure layout primitive).
 * ARIA: role="none" (transparent wrapper).
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AspectRatioSchema = {
	kind: "aspect-ratio",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: ["role=none"],
	interactions: [],
} as const satisfies ComponentSchema;
