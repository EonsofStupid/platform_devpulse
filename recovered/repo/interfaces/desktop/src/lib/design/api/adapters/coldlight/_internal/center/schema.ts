/**
 * @file Center Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Center is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root.
 * States: (none — pure layout primitive).
 * ARIA: (none — centering is a visual concern).
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CenterSchema = {
	kind: "center",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
