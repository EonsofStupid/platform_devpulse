import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Search field anatomy — text input optimized for search queries.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 * (search landmark) + standard text input pattern.
 *
 * A search field is a text input with role='search' on the container,
 * a search icon indicator, and a clear button. The input uses type='search'
 * for native behavior (clear on Escape in some browsers).
 *
 * Keyboard:
 * - Standard text input keyboard behavior
 * - Escape: clear the field (if clear button exists)
 */
export const searchFieldAnatomy = createAnatomy("search-field", {
	root: {
		description:
			"Search landmark container. Uses role='search' to provide a search landmark for screen reader users. Groups the input, icon, and clear button.",
		element: "div",
		required: true,
		aria: {
			role: "search",
			conditional: ["aria-label"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
	},
	input: {
		description:
			"Text input for search queries. Uses type='search' for native browser behavior. aria-label or visible label required for accessibility.",
		element: "input",
		required: true,
		aria: {
			conditional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
		},
		accepts: ["none"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			dismisses: "Escape",
			focusable: true,
		},
	},
	icon: {
		description:
			"Search icon indicator (magnifying glass). Purely decorative — hidden from assistive technology.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
	clear: {
		description:
			"Clear button that resets the search input to empty. Only visible when input has a value. Must have aria-label (typically 'Clear search').",
		element: "button",
		required: false,
		aria: {
			role: "button",
			required: ["aria-label"],
		},
		accepts: ["media"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});
