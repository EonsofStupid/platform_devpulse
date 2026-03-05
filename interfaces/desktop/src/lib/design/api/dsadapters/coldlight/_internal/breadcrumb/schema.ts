/**
 * @file Breadcrumb Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Breadcrumb is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, list, item, separator, link.
 * States: (none — static navigation structure).
 * ARIA: role="navigation", aria-label, aria-current, aria-hidden (separator).
 * Interactions: (none — navigation links handle their own activation).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const BreadcrumbSchema = {
	kind: "breadcrumb",
	engine: "coldlight",
	slots: ["root", "list", "item", "separator", "link"],
	states: [],
	aria: ["role=navigation", "aria-label", "aria-current", "aria-hidden", "role=presentation"],
	interactions: [],
} as const satisfies ComponentSchema;
