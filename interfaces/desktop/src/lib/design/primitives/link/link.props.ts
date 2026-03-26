import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";

/** Props for the raw Link primitive shell. */
export interface LinkPrimitiveProps extends Omit<HTMLAnchorAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
