/**
 * @file Badge Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Badge is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root.
 * States: decorative.
 * ARIA: aria-hidden (decorative), role="status" (informational), aria-label.
 * Interactions: (none — non-interactive display element).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const BadgeSchema = {
	kind: "badge",
	engine: "coldlight",
	slots: ["root"],
	states: ["decorative"],
	aria: ["aria-hidden", "role=status", "aria-label"],
	interactions: [],
} as const satisfies ComponentSchema;
