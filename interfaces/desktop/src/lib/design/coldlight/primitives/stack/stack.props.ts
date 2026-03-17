import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Stack primitive shell. */
export interface StackPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
