import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** Props for the raw Toggle primitive shell. */
export interface TogglePrimitiveProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
