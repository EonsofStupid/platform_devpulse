import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Loading overlay anatomy — full-container or full-screen loading state.
 *
 * WAI-ARIA: Uses aria-busy="true" on the element being loaded.
 */
export const loadingOverlayAnatomy = createAnatomy("loading-overlay", {
	root: {
		description:
			"Overlay container covering the parent element. Semi-transparent backdrop prevents interaction.",
		element: "div",
		required: true,
		aria: { conditional: ["aria-label"] },
		accepts: ["structural"],
		stateAttrs: ["data-visible"],
	},
	spinner: {
		description: "Centered loading indicator. Uses role='status' with aria-live='polite'.",
		element: "div",
		required: true,
		aria: { role: "status", required: ["aria-live"], conditional: ["aria-label"] },
		accepts: ["media"],
	},
	label: {
		description: "Optional visible loading text.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
});
