import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Heading anatomy — semantic section heading for document structure.
 *
 * Headings are the primary navigation mechanism for screen reader users.
 * Maintaining a logical heading outline (h1 → h2 → h3, no skipped levels)
 * is critical for accessibility.
 *
 * @see https://www.w3.org/WAI/tutorials/page-structure/headings/
 *
 * Keyboard: Headings are landmarks — screen readers navigate via heading shortcuts
 * (e.g., H key in NVDA/JAWS). Not focusable unless interactive.
 */
export const headingAnatomy = createAnatomy("heading", {
	root: {
		description:
			"Section heading providing document structure for screen reader navigation. Renders as h1-h6 based on level prop. When rendered as a non-heading element (div, span), aria-level MUST be set. Never skip heading levels (e.g., h1 → h3).",
		element: ["h1", "h2", "h3", "h4", "h5", "h6", "div", "span"],
		required: true,
		aria: {
			role: "heading",
			conditional: ["aria-level"],
		},
		accepts: ["text"],
		stateAttrs: ["data-level"],
	},
});
