import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Breadcrumbs anatomy — navigational trail showing page hierarchy.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * Breadcrumbs show the user's location within a site hierarchy. The last
 * item represents the current page and is NOT a link. Separators between
 * items are decorative (hidden from assistive technology).
 *
 * The root element uses a <nav> with aria-label="Breadcrumb" for landmark
 * navigation. Screen reader users can jump directly to it.
 *
 * Keyboard:
 * - Tab: moves through breadcrumb links (standard link navigation)
 * - Enter: activates the focused link
 */
export const breadcrumbsAnatomy = createAnatomy("breadcrumbs", {
	root: {
		description:
			"Navigation landmark containing the breadcrumb trail. Renders as <nav> with aria-label='Breadcrumb'. Provides a landmark for screen reader users to jump to.",
		element: "nav",
		required: true,
		aria: {
			required: ["aria-label"],
		},
		accepts: ["structural"],
	},
	list: {
		description:
			"Ordered list of breadcrumb items. Renders as <ol> — ordered because the sequence represents a hierarchy. Screen readers announce 'list, N items'.",
		element: "ol",
		required: true,
		accepts: ["structural"],
	},
	item: {
		description:
			"Individual breadcrumb entry. Renders as <li>. Contains a link (or plain text for the current page). The last item represents the current location.",
		element: "li",
		required: true,
		accepts: ["text", "interactive"],
		repeatable: true,
	},
	link: {
		description:
			"Navigational link within a breadcrumb item. The last breadcrumb's link should have aria-current='page' to indicate the current page. Can be a plain span for non-navigable current page.",
		element: ["a", "span"],
		required: true,
		aria: {
			conditional: ["aria-current"],
		},
		accepts: ["text", "media"],
		keyboard: {
			activates: ["Enter"],
			focusable: true,
		},
	},
	separator: {
		description:
			"Visual separator between breadcrumb items (e.g., '/', '>'). Purely decorative — hidden from assistive technology via aria-hidden='true'. Screen readers skip these entirely.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["text", "media"],
	},
});
