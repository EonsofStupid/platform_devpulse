import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * List anatomy — simple rendered list of items.
 *
 * A list renders a collection of items as an ordered or unordered list.
 * Uses native <ul>/<ol> and <li> elements for semantic list markup.
 * For selectable lists, use Listbox. For grid selection, use GridList.
 *
 * Keyboard: Not interactive (display only). Items may contain interactive elements.
 */
export const listAnatomy = createAnatomy("list", {
	root: {
		description:
			"List container. Uses native <ul> (unordered) or <ol> (ordered) element. Screen readers announce 'list, N items'.",
		element: ["ul", "ol"],
		required: true,
		accepts: ["structural"],
	},
	item: {
		description:
			"Individual list item. Uses native <li> element. May contain any content including interactive elements.",
		element: "li",
		required: true,
		accepts: ["any"],
		repeatable: true,
	},
});
