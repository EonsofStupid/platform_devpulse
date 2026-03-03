/**
 * @file Form Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Form is ColdLight-owned — engine: "coldlight".
 *
 * Native `<form>` element pattern with submit/reset handling,
 * disabled propagation, and pending submission state tracking.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const FormSchema = {
	kind: "form",
	engine: "coldlight",
	slots: ["root"],
	states: ["disabled", "pending"],
	aria: ["aria-label", "aria-busy"],
	interactions: ["submit", "reset"],
} as const satisfies ComponentSchema;
