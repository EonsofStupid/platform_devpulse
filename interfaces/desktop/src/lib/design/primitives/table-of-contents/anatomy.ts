import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Table of contents anatomy — document outline navigation.
 *
 * WAI-ARIA: Uses <nav> landmark with aria-label="Table of contents".
 *
 * A table of contents provides navigation to sections within a document
 * or page. Tracks the currently visible section via intersection observer
 * and highlights the corresponding item. Supports nested headings.
 *
 * Keyboard:
 * - Tab: navigate between TOC links
 * - Enter: navigate to section
 */
export const tableOfContentsAnatomy = createAnatomy("table-of-contents", {
	root: {
		description:
			"Navigation landmark for the table of contents. Uses <nav> with aria-label to distinguish from other nav landmarks on the page.",
		element: "nav",
		required: true,
		aria: {
			required: ["aria-label"],
		},
		accepts: ["structural"],
	},
	list: {
		description: "List of section links. Uses <ul> or <ol>. Supports nesting for sub-sections.",
		element: ["ul", "ol"],
		required: true,
		accepts: ["structural"],
	},
	item: {
		description:
			"Individual section entry. Contains a link and optionally a nested list for sub-sections.",
		element: "li",
		required: true,
		accepts: ["interactive", "structural"],
		stateAttrs: ["data-active"],
		repeatable: true,
	},
	link: {
		description:
			"Anchor link to a document section. The currently visible section's link has aria-current='true' and data-active.",
		element: "a",
		required: true,
		aria: {
			conditional: ["aria-current"],
		},
		accepts: ["text"],
		stateAttrs: ["data-active"],
		keyboard: {
			activates: ["Enter"],
			focusable: true,
		},
		repeatable: true,
	},
});
