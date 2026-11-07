/**
 * @file Code Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Code is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root.
 * States: (none — display-only primitive).
 * ARIA: (none — native <code> element provides implicit semantics).
 * Interactions: (none — non-interactive).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CodeSchema = {
	kind: "code",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
