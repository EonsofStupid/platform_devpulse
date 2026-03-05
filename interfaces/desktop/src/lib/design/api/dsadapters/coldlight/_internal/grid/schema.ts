/**
 * @file Grid Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Grid is ColdLight-owned — engine: "coldlight".
 *
 * CSS Grid layout container. No ARIA semantics — CSS Grid is a
 * layout model with no accessibility implications.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const GridSchema = {
	kind: "grid",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
