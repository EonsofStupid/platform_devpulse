import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Slider anatomy — continuous value selection via draggable thumb.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * A slider selects a value (or range) by dragging a thumb along a track.
 * Supports single thumb and dual thumb (range) modes. The output element
 * displays the current value in real-time.
 *
 * Keyboard:
 * - ArrowRight/ArrowUp: increase by step
 * - ArrowLeft/ArrowDown: decrease by step
 * - PageUp/PageDown: increase/decrease by larger step
 * - Home/End: jump to min/max
 */
export const sliderAnatomy = createAnatomy("slider", {
	root: {
		description:
			"Slider container. Groups track, thumb(s), label, and output. For range sliders, contains two thumbs.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-orientation", "data-disabled"],
	},
	track: {
		description:
			"Visual track representing the value range. The filled portion between min and current value may be styled differently. Contains the thumb(s).",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-orientation"],
	},
	thumb: {
		description:
			"Draggable indicator for the current value. Has role='slider' with aria-valuenow/min/max. For range sliders, there are two thumbs. Each thumb is independently focusable.",
		element: "span",
		required: true,
		aria: {
			role: "slider",
			required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
			conditional: [
				"aria-label",
				"aria-labelledby",
				"aria-orientation",
				"aria-valuetext",
				"aria-disabled",
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-dragging", "data-disabled"],
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
		repeatable: true,
	},
	label: {
		description: "Visible label for the slider. If omitted, thumb MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
	output: {
		description:
			"Live display of the current value. Uses <output> element with aria-live='off' (value changes are communicated via the thumb's aria-valuenow). Useful for showing formatted values (e.g., '$50').",
		element: "output",
		required: false,
		aria: {
			conditional: ["aria-live"],
		},
		accepts: ["text"],
	},
});
