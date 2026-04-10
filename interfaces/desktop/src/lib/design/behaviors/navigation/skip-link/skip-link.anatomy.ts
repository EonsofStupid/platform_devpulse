import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Skip link anatomy — keyboard shortcut to skip to main content.
 *
 * WAI-ARIA: https://www.w3.org/WAI/WCAG21/Techniques/general/G1
 */
export const skipLinkAnatomy = createAnatomy("skip-link", {
	root: {
		description:
			"Skip navigation link. The first focusable element on the page. Hidden visually until focused. Targets the main content area via href='#main-content'.",
		element: "a",
		required: true,
		accepts: ["text"],
		keyboard: { activates: ["Enter"], focusable: true },
	},
});
