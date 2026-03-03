/**
 * @file Callout Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Callout is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, icon, content.
 * States: (none — static informational element).
 * ARIA: role="note", aria-label, aria-hidden (icon).
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CalloutSchema = {
	kind: "callout",
	engine: "coldlight",
	slots: ["root", "icon", "content"],
	states: [],
	aria: ["role=note", "aria-label", "aria-hidden"],
	interactions: [],
} as const satisfies ComponentSchema;
