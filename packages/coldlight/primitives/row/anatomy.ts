import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Row anatomy — horizontal flex layout primitive.
 *
 * A row arranges children horizontally with configurable gap, alignment,
 * and wrapping. Pure layout — no ARIA semantics. For a vertical layout,
 * use Stack instead.
 */
export const rowAnatomy = createAnatomy("row", {
	root: {
		description:
			"Horizontal flex container. No semantic role — pure layout element. Arranges children in a row with configurable gap, alignment, and wrapping.",
		element: "div",
		required: true,
		accepts: ["any"],
	},
});
