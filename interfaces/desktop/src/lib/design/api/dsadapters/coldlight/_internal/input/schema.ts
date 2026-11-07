/**
 * @file Input Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Input is ColdLight-owned — engine: "coldlight".
 *
 * Native `<input>` element with validation state support.
 * Relies on implicit textbox role from native element.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const InputSchema = {
	kind: "input",
	engine: "coldlight",
	slots: ["root"],
	states: ["disabled", "readonly", "required", "invalid"],
	aria: ["aria-invalid", "aria-required", "aria-disabled", "aria-readonly", "aria-label", "aria-labelledby", "aria-describedby", "aria-errormessage"],
	interactions: ["input"],
} as const satisfies ComponentSchema;
