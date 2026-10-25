/**
 * @file Label Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Label is ColdLight-owned — engine: "coldlight".
 *
 * Form control label using native `<label>` semantics.
 * `for` attribute associates with a control via ID.
 * Click on label focuses/activates the associated control (native behavior).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const LabelSchema = {
	kind: "label",
	engine: "coldlight",
	slots: ["root"],
	states: ["disabled"],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
