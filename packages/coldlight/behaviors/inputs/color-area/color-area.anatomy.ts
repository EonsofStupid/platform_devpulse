import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Color area anatomy — 2D color channel selector (saturation + lightness).
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * A color area exposes a rectangular region where the user adjusts two
 * color channels simultaneously — typically saturation (x-axis) and
 * lightness (y-axis) for a fixed hue. The thumb represents the current
 * position as an `aria-valuenow` / `aria-valuetext` pair that describes
 * both coordinates. Keyboard moves the thumb in two dimensions.
 *
 * Keyboard:
 * - ArrowRight / ArrowLeft: increase/decrease x-axis channel
 * - ArrowUp / ArrowDown: increase/decrease y-axis channel
 * - PageUp / PageDown: large y-axis jump (10× step)
 * - Shift + Arrow: large step (10×)
 * - Home / End: jump to corner (0,0) / (1,1)
 */
export const colorAreaAnatomy = createAnatomy("color-area", {
	root: {
		description: "Container for the 2D color area. Wraps gradient, thumb, and label.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
	},
	gradient: {
		description:
			"Gradient surface displaying the 2D color range. Background is painted programmatically from the current hue and the two channels being controlled.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
	},
	thumb: {
		description:
			"Draggable indicator showing the current (x, y) position on the gradient. Exposes role=slider with aria-valuetext describing both coordinates. Positioned via CSS transform.",
		element: "span",
		required: true,
		accepts: ["none"],
		stateAttrs: ["data-dragging", "data-disabled"],
		aria: {
			role: "slider",
			required: ["aria-valuenow", "aria-valuetext", "aria-label"],
		},
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
	label: {
		description: "Visible label identifying which channels this color area controls.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});
