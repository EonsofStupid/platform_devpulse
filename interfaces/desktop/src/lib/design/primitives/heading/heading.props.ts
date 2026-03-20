import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Heading primitive shell. */
export interface HeadingPrimitiveProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	level?: 1 | 2 | 3 | 4 | 5 | 6;
}
