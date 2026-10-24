import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Table of contents anatomy — document outline navigation.
 */
export const tableOfContentsAnatomy = createAnatomy("table-of-contents", {
	root: {
		description: "Navigation landmark for the table of contents. Uses <nav> with aria-label.",
		element: "nav",
		required: true,
		aria: { required: ["aria-label"] },
		accepts: ["structural"],
	},
	list: {
		description: "List of section links. Supports nesting for sub-sections.",
		element: ["ul", "ol"],
		required: true,
		accepts: ["structural"],
	},
	item: {
		description: "Individual section entry. Contains a link and optionally a nested list.",
		element: "li",
		required: true,
		accepts: ["interactive", "structural"],
		stateAttrs: ["data-active"],
		repeatable: true,
	},
	link: {
		description: "Anchor link to a document section. Active section has aria-current='true'.",
		element: "a",
		required: true,
		aria: { conditional: ["aria-current"] },
		accepts: ["text"],
		stateAttrs: ["data-active"],
		keyboard: { activates: ["Enter"], focusable: true },
		repeatable: true,
	},
});
