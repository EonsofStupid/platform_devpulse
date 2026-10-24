import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Stack anatomy — vertical flex layout primitive.
 *
 * A stack arranges children vertically with configurable gap and alignment.
 * The most common layout primitive. Pure layout — no ARIA semantics.
 * For horizontal layout, use Row instead.
 */
export const stackAnatomy = createAnatomy("stack", {
	root: {
		description:
			"Vertical flex container. No semantic role — pure layout element. Arranges children in a column with configurable gap and alignment.",
		element: "div",
		required: true,
		accepts: ["any"],
	},
});
