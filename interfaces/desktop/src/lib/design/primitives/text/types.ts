import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Valid semantic elements for Text. */
export type TextElement = "span" | "p" | "strong" | "em" | "small" | "div";

/** Props for the Text primitive — polymorphic text element. */
export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Semantic HTML element to render. Default: "span" */
	as?: TextElement;
	children?: Snippet;
	class?: string;
}
