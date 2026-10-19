import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Steps anatomy — multi-step progress indicator.
 *
 * WAI-ARIA: Uses aria-current="step" for the active step.
 */
export const stepsAnatomy = createAnatomy("steps", {
	root: {
		description: "Steps container. Uses <nav> with aria-label for landmark navigation.",
		element: "nav",
		required: true,
		aria: { required: ["aria-label"] },
		accepts: ["structural"],
		stateAttrs: ["data-orientation"],
	},
	list: {
		description: "Ordered list of steps. Renders as <ol> because step order matters.",
		element: "ol",
		required: true,
		accepts: ["structural"],
	},
	item: {
		description: "Individual step entry. Tracks completed/current/upcoming state via data-status.",
		element: "li",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-status", "data-disabled"],
		repeatable: true,
	},
	trigger: {
		description: "Clickable step indicator. The current step has aria-current='step'.",
		element: ["button", "a"],
		required: true,
		aria: { conditional: ["aria-current", "aria-disabled"] },
		accepts: ["text", "media"],
		stateAttrs: ["data-status"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
		repeatable: true,
	},
	separator: {
		description:
			"Visual connector between steps. Purely decorative — hidden from assistive technology.",
		element: "div",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
		stateAttrs: ["data-status"],
		repeatable: true,
	},
});
