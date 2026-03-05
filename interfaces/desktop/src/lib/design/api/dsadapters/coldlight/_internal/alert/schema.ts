/**
 * @file Alert Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Alert is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, icon, title, description, action.
 * States: visible.
 * ARIA: role="alert", aria-label, aria-labelledby, aria-hidden (icon).
 * Interactions: click (action dismiss).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AlertSchema = {
	kind: "alert",
	engine: "coldlight",
	slots: ["root", "icon", "title", "description", "action"],
	states: ["visible"],
	aria: ["role=alert", "aria-label", "aria-labelledby", "aria-hidden"],
	interactions: ["click"],
} as const satisfies ComponentSchema;
