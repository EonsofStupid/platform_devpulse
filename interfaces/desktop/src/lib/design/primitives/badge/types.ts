import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Badge primitive shell. */
export interface BadgePrimitiveProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
