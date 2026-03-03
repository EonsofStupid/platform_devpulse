/**
 * @file EmptyState Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * EmptyState is ColdLight-owned — engine: "coldlight".
 *
 * Placeholder UI shown when a content area has no data.
 * Root is a polite live region (`role="status"`).
 * Icon is decorative (`role="presentation"`, `aria-hidden`).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const EmptyStateSchema = {
	kind: "empty-state",
	engine: "coldlight",
	slots: ["root", "icon", "title", "description", "action"],
	states: [],
	aria: ["aria-label", "aria-hidden"],
	interactions: [],
} as const satisfies ComponentSchema;
