import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Steps anatomy — multi-step progress indicator.
 *
 * WAI-ARIA: Uses aria-current="step" for the active step.
 * Navigation landmark with ordered list semantics.
 *
 * A steps indicator shows progress through a multi-step process (wizard,
 * onboarding, checkout). Each step shows its status: completed, current,
 * or upcoming. Steps can be clickable for navigation or static for display.
 *
 * Keyboard:
 * - Tab: move between clickable steps
 * - Enter/Space: activate a clickable step
 */
export const stepsAnatomy = createAnatomy("steps", {
	root: {
		description:
			"Steps container. Uses <nav> with aria-label for landmark navigation. Contains an ordered list of step items.",
		element: "nav",
		required: true,
		aria: {
			required: ["aria-label"],
		},
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
		description:
			"Individual step entry. Contains the step indicator and label. Tracks completed/current/upcoming state via data-status.",
		element: "li",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-status", "data-disabled"],
		repeatable: true,
	},
	trigger: {
		description:
			"Clickable step indicator (when steps are navigable). The current step has aria-current='step'. Completed steps are clickable, upcoming steps may be disabled.",
		element: ["button", "a"],
		required: true,
		aria: {
			conditional: ["aria-current", "aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-status"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
	separator: {
		description:
			"Visual connector between steps (line, arrow, etc.). Purely decorative — hidden from assistive technology.",
		element: "div",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
		stateAttrs: ["data-status"],
		repeatable: true,
	},
});
