import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Panel anatomy — a glass container with header, body and footer.
 *
 * A pure layout component: no ARIA of its own. Give it a landmark (region,
 * section, article) and an accessible name when it stands for one.
 */
export const panelAnatomy = createAnatomy("panel", {
	root: {
		description: "The panel's surface, a column holding its header, body and footer.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	header: {
		description: "Title row, separated from the body.",
		element: "div",
		required: false,
		accepts: ["any"],
	},
	body: {
		description: "The scrolling content.",
		element: "div",
		required: true,
		accepts: ["any"],
	},
	footer: {
		description: "Action row, separated from the body.",
		element: "div",
		required: false,
		accepts: ["any"],
	},
});
