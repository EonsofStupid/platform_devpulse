/**
 * @file Textarea Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Textarea primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Textarea relies on native <textarea> semantics with aria-multiline,
 * validation state ARIA (aria-invalid, aria-required), and oninput handling.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TextareaSchema = {
	kind: "textarea",
	engine: "coldlight",
	slots: ["root"],
	states: ["disabled", "readonly", "required", "invalid"],
	aria: [
		"aria-multiline",
		"aria-invalid",
		"aria-required",
		"aria-disabled",
		"aria-readonly",
		"aria-label",
		"aria-labelledby",
		"aria-describedby",
		"aria-errormessage",
	],
	interactions: ["input"],
} as const satisfies ComponentSchema;
