import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * List anatomy — simple rendered list of items.
 *
 * A list renders a collection of items as an ordered or unordered list.
 * For selectable lists, use Listbox. For grid selection, use GridList.
 *
 * Keyboard: Not interactive (display only).
 */
export const listAnatomy = createAnatomy("list", {
	root: {
		description: "List container. Uses native <ul> (unordered) or <ol> (ordered) element.",
		element: ["ul", "ol"],
		required: true,
		accepts: ["structural"],
	},
	item: {
		description: "Individual list item. Uses native <li> element. May contain any content.",
		element: "li",
		required: true,
		accepts: ["any"],
		repeatable: true,
	},
});
