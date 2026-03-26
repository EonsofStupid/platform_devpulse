import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** Props for the raw Checkbox primitive shell. */
export interface CheckboxPrimitiveProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
