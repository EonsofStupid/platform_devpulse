import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** Props for the raw Switch primitive shell. */
export interface SwitchPrimitiveProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
