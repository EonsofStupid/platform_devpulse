import type { Snippet } from "svelte";
import type { HTMLLabelAttributes } from "svelte/elements";

/** Props for the raw Label primitive shell. */
export interface LabelPrimitiveProps extends Omit<HTMLLabelAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
