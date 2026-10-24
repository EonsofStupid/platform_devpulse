import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Progress anatomy — task completion indicator.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/meter/ (progressbar role)
 *
 * A progress bar shows task completion (determinate) or activity (indeterminate).
 * NOT for scalar measurements — use Meter for disk usage, signal strength, etc.
 * Progress is for tasks: file upload, form steps, loading.
 *
 * Keyboard: Not interactive — read-only display.
 */
export const progressAnatomy = createAnatomy("progress", {
	root: {
		description:
			"Progress container. Uses role='progressbar' with value attributes. For determinate: aria-valuenow + aria-valuemin + aria-valuemax. For indeterminate: omit aria-valuenow entirely (do NOT set it to 0).",
		element: ["div", "progress"],
		required: true,
		aria: {
			role: "progressbar",
			required: ["aria-valuemin", "aria-valuemax"],
			conditional: ["aria-valuenow", "aria-valuetext", "aria-label", "aria-labelledby"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-state"],
	},
	track: {
		description:
			"Visual track representing the full range (0% to 100%). Background element for the fill bar.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	fill: {
		description:
			"Visual fill showing completion percentage. Width set as percentage via inline style. For indeterminate state, uses CSS animation instead of width.",
		element: "div",
		required: true,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
	label: {
		description:
			"Visible label describing what task is progressing (e.g., 'Uploading files...'). If omitted, root MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
	},
});
