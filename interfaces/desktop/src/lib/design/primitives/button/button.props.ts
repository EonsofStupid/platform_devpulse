import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** Props for the raw Button primitive shell. */
export interface ButtonPrimitiveProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
