/**
 * @file Card Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Card is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, header, content, footer.
 * States: (none — static semantic grouping container).
 * ARIA: role="group", aria-label, aria-labelledby.
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CardSchema = {
	kind: "card",
	engine: "coldlight",
	slots: ["root", "header", "content", "footer"],
	states: [],
	aria: ["role=group", "aria-label", "aria-labelledby"],
	interactions: [],
} as const satisfies ComponentSchema;
