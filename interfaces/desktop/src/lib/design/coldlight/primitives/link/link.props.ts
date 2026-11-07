import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** Props for the raw Link primitive shell. */
export interface LinkPrimitiveProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
