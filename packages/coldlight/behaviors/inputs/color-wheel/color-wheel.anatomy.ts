import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Color wheel anatomy — circular hue picker (0° – 360°).
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * A color wheel lets the user drag a thumb around a circular track to
 * select a hue angle. The thumb exposes role=slider with
 * `aria-valuenow` = hue in degrees (0..360) and `aria-valuemax=360`.
 * Keyboard moves the thumb 1° at a time on Arrow keys, 10° on PageUp
 * / PageDown, and jumps to 0° / 360° on Home / End.
 *
 * Keyboard:
 * - ArrowRight / ArrowUp: +1°
 * - ArrowLeft / ArrowDown: -1°
 * - PageUp: +10°
 * - PageDown: -10°
 * - Home: 0°
 * - End: 360°
 */
export const colorWheelAnatomy = createAnatomy("color-wheel", {
	root: {
		description: "Container for the circular color wheel. Wraps track and thumb.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
	},
	track: {
		description:
			"Circular gradient track painted with the full 360° hue range. Accepts pointer events anywhere inside the ring.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
	},
	thumb: {
		description:
			"Draggable indicator positioned on the ring via CSS transform. Exposes role=slider with aria-valuenow = hue degrees.",
		element: "span",
		required: true,
		accepts: ["none"],
		stateAttrs: ["data-dragging", "data-disabled"],
		aria: {
			role: "slider",
			required: ["aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-label"],
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
});
