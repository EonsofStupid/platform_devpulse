import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Pagination anatomy — page navigation for paginated content.
 *
 * WAI-ARIA: Uses nav landmark with aria-label.
 */
export const paginationAnatomy = createAnatomy("pagination", {
	root: {
		description: "Navigation landmark for pagination. Uses <nav> with aria-label.",
		element: "nav",
		required: true,
		aria: { required: ["aria-label"] },
		accepts: ["structural"],
	},
	list: {
		description: "Ordered list of page navigation items.",
		element: "ul",
		required: true,
		accepts: ["structural"],
	},
	item: {
		description: "Individual page navigation entry.",
		element: "li",
		required: true,
		accepts: ["interactive", "text"],
		repeatable: true,
	},
	page: {
		description: "Page number button. The current page has aria-current='page'.",
		element: ["button", "a"],
		required: true,
		aria: { conditional: ["aria-current", "aria-disabled", "aria-label"] },
		accepts: ["text"],
		stateAttrs: ["data-selected", "data-disabled"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
		repeatable: true,
	},
	previous: {
		description: "Previous page button. Disabled when on the first page. Must have aria-label.",
		element: ["button", "a"],
		required: true,
		aria: { required: ["aria-label"], conditional: ["aria-disabled"] },
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
	},
	next: {
		description: "Next page button. Disabled when on the last page. Must have aria-label.",
		element: ["button", "a"],
		required: true,
		aria: { required: ["aria-label"], conditional: ["aria-disabled"] },
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
	},
	ellipsis: {
		description:
			"Indicator for skipped page ranges. Not interactive. Hidden from assistive technology.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["text"],
	},
});
