/**
 * @file Divider Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Divider is ColdLight-owned — engine: "coldlight".
 *
 * Separator pattern with semantic and decorative modes.
 * Functionally identical to Separator — distinct primitive per taxonomy.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const DividerSchema = {
	kind: "divider",
	engine: "coldlight",
	slots: ["root"],
	states: ["decorative"],
	aria: ["aria-orientation", "aria-hidden"],
	interactions: [],
} as const satisfies ComponentSchema;
