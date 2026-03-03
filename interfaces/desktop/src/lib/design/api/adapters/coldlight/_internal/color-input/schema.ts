/**
 * @file ColorInput Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * ColorInput is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, swatch, input, label.
 * States: disabled, required, invalid.
 * ARIA: role="group", role="presentation", aria-labelledby, aria-label,
 *       aria-describedby, aria-invalid, aria-required, aria-disabled,
 *       aria-hidden (swatch).
 * Interactions: input (color value change).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ColorInputSchema = {
	kind: "color-input",
	engine: "coldlight",
	slots: ["root", "swatch", "input", "label"],
	states: ["disabled", "required", "invalid"],
	aria: [
		"role=group",
		"role=presentation",
		"aria-labelledby",
		"aria-label",
		"aria-describedby",
		"aria-invalid",
		"aria-required",
		"aria-disabled",
		"aria-hidden",
	],
	interactions: ["input"],
} as const satisfies ComponentSchema;
