import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Prose size presets affecting base font size and spacing */
export type ProseSize = "sm" | "base" | "lg" | "xl";

/**
 * Structural props for the Prose primitive.
 *
 * A prose container applies typographic styling to rendered HTML content.
 * For individual text elements, use Text. For headings, use Heading.
 * Prose is for blocks of rich content where you don't control the
 * individual elements (markdown render, CMS content, etc.).
 *
 * @example
 * ```svelte
 * <article {...proseAnatomy.attrs.root}>
 *   {@html renderedMarkdown}
 * </article>
 * ```
 */
export interface ProsePrimitiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Snippet content rendered inside the prose container */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Semantic element to render. Default: "div" */
	as?: "div" | "article" | "section";
	/** Prose size preset. Default: "base" */
	size?: ProseSize;
}
