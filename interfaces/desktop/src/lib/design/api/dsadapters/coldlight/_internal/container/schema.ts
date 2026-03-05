/**
 * @file Container Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Container is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root.
 * States: (none — pure layout primitive).
 * ARIA: (none — max-width constraining is a visual concern).
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ContainerSchema = {
	kind: "container",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
