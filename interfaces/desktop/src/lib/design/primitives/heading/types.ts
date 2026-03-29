import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Valid heading levels (h1-h6) */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** HTML element for heading rendering */
export type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";

/**
 * Structural props for the Heading primitive.
 *
 * Headings provide document structure for screen reader navigation.
 * The `level` prop determines both the semantic heading level AND
 * the HTML element (h1-h6) unless `as` overrides it.
 *
 * When `as` is a non-heading element (div, span), `aria-level` is set
 * automatically from the `level` prop.
 *
 * @example
 * ```svelte
 * <!-- Renders as <h2> -->
 * <Heading level={2}>Section Title</Heading>
 *
 * <!-- Renders as <div role="heading" aria-level="2"> -->
 * <Heading level={2} as="div">Styled Section Title</Heading>
 * ```
 */
export interface HeadingPrimitiveProps
	extends Omit<HTMLAttributes<HTMLHeadingElement>, "children"> {
	/** Snippet content rendered inside the heading */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Heading level (1-6). Determines semantic level and default element. */
	level?: HeadingLevel;
	/** Override the rendered HTML element. When non-heading, aria-level is set. */
	as?: HeadingElement;
}
