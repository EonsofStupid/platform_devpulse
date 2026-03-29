import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Kbd anatomy — keyboard shortcut display.
 *
 * Renders keyboard shortcuts using the semantic <kbd> element.
 * Multiple keys in a combination are separated visually (e.g., Ctrl+S).
 * Purely display — not interactive.
 *
 * Keyboard: Not interactive.
 */
export const kbdAnatomy = createAnatomy("kbd", {
	root: {
		description:
			"Keyboard shortcut container. Uses <kbd> element for semantic keyboard input display. For compound shortcuts (Ctrl+S), contains multiple key children.",
		element: "span",
		required: true,
		accepts: ["structural"],
	},
	key: {
		description:
			"Individual key in the shortcut. Uses <kbd> element. Styled with bordered/raised appearance to mimic physical key caps.",
		element: "span",
		required: true,
		accepts: ["text"],
		repeatable: true,
	},
	separator: {
		description:
			"Visual separator between keys (e.g., '+', '→'). Decorative — hidden from assistive technology.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["text"],
	},
});
