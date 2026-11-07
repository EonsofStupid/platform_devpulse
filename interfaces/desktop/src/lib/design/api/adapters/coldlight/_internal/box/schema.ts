/**
 * @file Box Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Box is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root.
 * States: (none — generic layout container).
 * ARIA: (none — native HTML semantics).
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const BoxSchema = {
	kind: "box",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
