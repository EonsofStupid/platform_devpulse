/**
 * @file Checkbox Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Checkbox is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, indicator, label.
 * States: checked, indeterminate, disabled, required.
 * ARIA: role="checkbox", aria-checked, aria-disabled, aria-required,
 *       aria-label, aria-labelledby, aria-describedby, aria-hidden (indicator).
 * Interactions: click, keydown.space.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CheckboxSchema = {
	kind: "checkbox",
	engine: "coldlight",
	slots: ["root", "indicator", "label"],
	states: ["checked", "indeterminate", "disabled", "required"],
	aria: [
		"role=checkbox",
		"aria-checked",
		"aria-disabled",
		"aria-required",
		"aria-label",
		"aria-labelledby",
		"aria-describedby",
		"aria-hidden",
	],
	interactions: ["click", "keydown.space"],
} as const satisfies ComponentSchema;
