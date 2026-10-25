import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Skip link anatomy — accessibility bypass navigation link.
 *
 * WAI-ARIA: https://www.w3.org/WAI/WCAG21/Techniques/general/G1
 *
 * A skip link is visually hidden until focused, then appears to let
 * keyboard users bypass repetitive navigation and jump directly to
 * the main content. Required for WCAG 2.1 Level A compliance.
 *
 * Must be the FIRST focusable element on the page.
 *
 * Keyboard:
 * - Tab: reveals the skip link (first Tab press on page)
 * - Enter: activates the link, moves focus to target
 */
export const skipLinkAnatomy = createAnatomy("skip-link", {
	root: {
		description:
			"Bypass navigation link. Visually hidden until focused via Tab. On activation, moves focus to the target element (typically #main-content). Must be the first focusable element in DOM order.",
		element: "a",
		required: true,
		aria: {
			conditional: ["aria-label"],
		},
		accepts: ["text"],
		keyboard: {
			activates: ["Enter"],
			focusable: true,
		},
	},
});
