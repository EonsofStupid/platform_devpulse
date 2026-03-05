/**
 * @file FormField Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * FormField is ColdLight-owned — engine: "coldlight".
 *
 * Compound form field pattern: root group, label, control, description,
 * and error message. ARIA linkage between all slots via aria-labelledby
 * and aria-describedby.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const FormFieldSchema = {
	kind: "form-field",
	engine: "coldlight",
	slots: ["root", "label", "control", "description", "error"],
	states: ["invalid", "required", "disabled"],
	aria: ["aria-labelledby", "aria-describedby", "aria-invalid", "aria-required", "aria-disabled"],
	interactions: [],
} as const satisfies ComponentSchema;
