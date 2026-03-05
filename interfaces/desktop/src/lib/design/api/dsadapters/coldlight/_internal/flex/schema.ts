/**
 * @file Flex Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Flex is ColdLight-owned — engine: "coldlight".
 *
 * Flexbox layout container. No ARIA semantics — flex layout is a
 * purely visual concern with no accessibility implications.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const FlexSchema = {
	kind: "flex",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
