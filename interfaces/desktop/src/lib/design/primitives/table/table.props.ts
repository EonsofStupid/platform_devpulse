import type { Snippet } from "svelte";
import type { HTMLTableAttributes } from "svelte/elements";

/** Props for the raw Table primitive shell. */
export interface TablePrimitiveProps extends Omit<HTMLTableAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
