/**
 * @file HStack Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * HStack is ColdLight-owned — engine: "coldlight".
 *
 * Horizontal flex shorthand container. No ARIA semantics —
 * horizontal stacking is a purely visual concern.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const HStackSchema = {
	kind: "hstack",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
