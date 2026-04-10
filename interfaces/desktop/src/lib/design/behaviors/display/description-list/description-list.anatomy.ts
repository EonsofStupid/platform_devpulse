import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Description list anatomy — term/detail pairs.
 *
 * Uses native <dl>, <dt>, <dd> elements for semantic term-definition pairs.
 * Used for metadata displays, key-value pairs, glossaries, and detail panels.
 *
 * No ARIA roles needed — the native elements provide full semantics.
 * Screen readers announce "definition list, N items".
 *
 * Keyboard: Not interactive (display only).
 */
export const descriptionListAnatomy = createAnatomy("description-list", {
	root: {
		description:
			"Description list container. Uses native <dl> element for semantic term-definition pairs.",
		element: "dl",
		required: true,
		accepts: ["structural"],
	},
	term: {
		description: "Term/label element. Uses native <dt>. The name or key in a key-value pair.",
		element: "dt",
		required: true,
		accepts: ["text"],
		repeatable: true,
	},
	detail: {
		description:
			"Detail/value element. Uses native <dd>. The value or definition for the preceding term.",
		element: "dd",
		required: true,
		accepts: ["any"],
		repeatable: true,
	},
});
