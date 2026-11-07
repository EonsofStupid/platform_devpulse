import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Pagination anatomy — page navigation for paginated content.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 * (Pagination uses nav landmark with aria-label)
 *
 * Pagination provides navigation between pages of content. Includes
 * previous/next buttons, page number buttons, and an optional ellipsis
 * for skipped ranges. The current page is indicated with aria-current="page".
 *
 * Keyboard:
 * - Tab: move between page buttons
 * - Enter/Space: activate page button
 */
export const paginationAnatomy = createAnatomy("pagination", {
	root: {
		description:
			"Navigation landmark for pagination. Uses <nav> with aria-label='Pagination' so screen reader users can jump to it directly.",
		element: "nav",
		required: true,
		aria: {
			required: ["aria-label"],
		},
		accepts: ["structural"],
	},
	list: {
		description: "Ordered list of page navigation items. Renders as <ul> or <ol>.",
		element: "ul",
		required: true,
		accepts: ["structural"],
	},
	item: {
		description:
			"Individual page navigation entry. Contains a page button, previous/next, or ellipsis.",
		element: "li",
		required: true,
		accepts: ["interactive", "text"],
		repeatable: true,
	},
	page: {
		description:
			"Page number button. The current page has aria-current='page'. Disabled state for non-navigable pages.",
		element: ["button", "a"],
		required: true,
		aria: {
			conditional: ["aria-current", "aria-disabled", "aria-label"],
		},
		accepts: ["text"],
		stateAttrs: ["data-selected", "data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
	previous: {
		description:
			"Previous page button. Disabled when on the first page. Must have aria-label (typically 'Previous page').",
		element: ["button", "a"],
		required: true,
		aria: {
			required: ["aria-label"],
			conditional: ["aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	next: {
		description:
			"Next page button. Disabled when on the last page. Must have aria-label (typically 'Next page').",
		element: ["button", "a"],
		required: true,
		aria: {
			required: ["aria-label"],
			conditional: ["aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	ellipsis: {
		description:
			"Indicator for skipped page ranges (e.g., '...'). Not interactive. Hidden from assistive technology.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["text"],
	},
});
