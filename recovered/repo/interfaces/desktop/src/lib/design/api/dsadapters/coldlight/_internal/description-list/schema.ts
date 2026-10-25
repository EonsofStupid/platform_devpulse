/**
 * @file DescriptionList Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * DescriptionList is ColdLight-owned — engine: "coldlight".
 *
 * Semantic `<dl>` structure. Native `<dt>`/`<dd>` elements provide
 * implicit term/definition semantics. No explicit ARIA roles needed.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const DescriptionListSchema = {
	kind: "description-list",
	engine: "coldlight",
	slots: ["root", "item", "term", "details"],
	states: [],
	aria: ["aria-label"],
	interactions: [],
} as const satisfies ComponentSchema;
