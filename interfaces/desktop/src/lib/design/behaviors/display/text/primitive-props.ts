import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { TextElement } from "./text.types.js";

/**
 * Structural props for the Text primitive.
 *
 * A text primitive renders as the appropriate semantic text element.
 * Choose the element based on meaning: `<strong>` for importance,
 * `<em>` for emphasis, `<small>` for side comments, `<p>` for paragraphs.
 *
 * @example
 * ```svelte
 * <p {...textAnatomy.attrs.root}>
 *   Paragraph content here.
 * </p>
 * ```
 */
export interface TextPrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Semantic HTML element to render. Default: "span" */
	as?: TextElement;
	/** Snippet content rendered inside the text element */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
}
