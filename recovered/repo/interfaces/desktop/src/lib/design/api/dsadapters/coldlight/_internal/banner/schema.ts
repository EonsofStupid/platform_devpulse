/**
 * @file Banner Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Banner is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, icon, content, action.
 * States: visible.
 * ARIA: role="alert", aria-label, aria-live, aria-hidden (icon).
 * Interactions: click (action dismiss).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const BannerSchema = {
	kind: "banner",
	engine: "coldlight",
	slots: ["root", "icon", "content", "action"],
	states: ["visible"],
	aria: ["role=alert", "aria-label", "aria-live", "aria-hidden"],
	interactions: ["click"],
} as const satisfies ComponentSchema;
