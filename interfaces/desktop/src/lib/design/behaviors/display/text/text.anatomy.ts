import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Text anatomy — polymorphic text element.
 *
 * A text primitive renders as the appropriate semantic text element
 * (span, p, strong, em, small, div). Inherits ARIA semantics from the
 * chosen element. No additional ARIA roles needed.
 */
export const textAnatomy = createAnatomy("text", {
	root: {
		description:
			"Polymorphic text element. Renders as the element specified by the 'as' prop (span, p, strong, em, small, div). Inherits semantic meaning from the chosen element. No additional ARIA roles needed.",
		element: ["span", "p", "strong", "em", "small", "div"],
		required: true,
		accepts: ["text"],
	},
});
