import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Prose anatomy — rich text content container with typographic styling.
 *
 * A prose container applies consistent typographic styling to rendered
 * HTML content (from markdown, CMS, or rich text editors). Handles
 * headings, paragraphs, lists, code blocks, blockquotes, tables, and
 * images within the content area.
 *
 * No ARIA roles needed — the content itself uses semantic HTML.
 *
 * Keyboard: Not interactive (content may contain interactive elements).
 */
export const proseAnatomy = createAnatomy("prose", {
	root: {
		description:
			"Rich text content container. Applies consistent typographic styling to rendered HTML content. All descendant elements (h1-h6, p, ul, ol, blockquote, pre, table, img) receive prose typography styles.",
		element: ["div", "article", "section"],
		required: true,
		accepts: ["any"],
	},
});
