/**
 * @file Heading Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Heading is ColdLight-owned — engine: "coldlight".
 *
 * Semantic heading with level decoupled from visual scale.
 * Uses `role="heading"` + `aria-level` to allow visual element
 * to be independent of semantic heading level.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const HeadingSchema = {
	kind: "heading",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: ["aria-level"],
	interactions: [],
} as const satisfies ComponentSchema;
