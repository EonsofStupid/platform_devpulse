/**
 * Content anatomy — generic rich text content container.
 *
 * A polymorphic wrapper for body-level prose or arbitrary content.
 * The element rendered (div, section, article, aside, main) is determined
 * by the `as` prop on the component.
 *
 * WAI-ARIA: Inherits semantics from the chosen element. No additional
 * ARIA roles unless using a landmark element (section, aside, etc.)
 * which require aria-label when multiple of the same kind exist.
 */

export const contentAnatomy = {
	slots: ["root"] as const,
	attrs: {
		root: {
			"data-kind": "content",
			"data-slot": "root",
		},
	},
} as const;
