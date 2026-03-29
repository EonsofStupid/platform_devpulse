import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Color slider anatomy — single-axis color channel selector.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * A color slider controls one color channel (hue, saturation, lightness,
 * alpha, etc.) via a draggable thumb on a gradient track. The track
 * background visualizes the color range for that channel.
 *
 * Keyboard:
 * - ArrowRight/ArrowUp: increase value
 * - ArrowLeft/ArrowDown: decrease value
 * - Home: minimum value
 * - End: maximum value
 * - PageUp/PageDown: larger increments
 */
export const colorSliderAnatomy = createAnatomy("color-slider", {
	root: {
		description:
			"Container for the color slider. Groups track, thumb, and label. Sets the slider role with value range attributes.",
		element: "div",
		required: true,
		aria: {
			role: "slider",
			required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
			conditional: ["aria-label", "aria-labelledby", "aria-orientation", "aria-valuetext"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-orientation", "data-disabled"],
		keyboard: {
			navigates: [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Home",
				"End",
				"PageUp",
				"PageDown",
			],
			focusable: true,
		},
	},
	track: {
		description:
			"Gradient track displaying the color range for the controlled channel. Background gradient is set programmatically based on the current color and channel.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-orientation"],
	},
	thumb: {
		description:
			"Draggable indicator showing the current value position on the track. Positioned via CSS transform based on the normalized value (0-1).",
		element: "span",
		required: true,
		accepts: ["none"],
		stateAttrs: ["data-dragging"],
	},
	label: {
		description:
			"Visible label identifying which color channel this slider controls (e.g., 'Hue', 'Saturation'). If omitted, root MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});
