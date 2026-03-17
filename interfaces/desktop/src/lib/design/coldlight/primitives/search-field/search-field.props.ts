import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw SearchField primitive shell. */
export interface SearchFieldPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
