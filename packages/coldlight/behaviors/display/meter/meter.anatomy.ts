import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Meter anatomy — scalar measurement within a known range.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * A meter displays a scalar value within a known range. NOT for progress —
 * use Progress for task completion. Meter is for known quantities: disk usage,
 * password strength, vote results, CPU temperature.
 *
 * The meter element has built-in optimum/low/high semantics for color coding.
 *
 * Keyboard: Not interactive — read-only display.
 */
export const meterAnatomy = createAnatomy("meter", {
	root: {
		description:
			"Meter container. Uses role='meter' (or native <meter> element). Displays a scalar value within a known min/max range. aria-valuenow is the current value, aria-valuetext provides human-readable description.",
		element: ["div", "meter"],
		required: true,
		aria: {
			role: "meter",
			required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
			conditional: ["aria-valuetext", "aria-label", "aria-labelledby"],
		},
		accepts: ["structural"],
	},
	track: {
		description: "Visual track representing the full range. Background element for the fill bar.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	fill: {
		description:
			"Visual fill showing the current value as a proportion of the range. Width/height set as percentage via inline style. Color may change based on optimum/low/high thresholds.",
		element: "div",
		required: true,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
	label: {
		description:
			"Visible label describing what the meter measures (e.g., 'Disk usage', 'Signal strength'). If omitted, root MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
	},
});
