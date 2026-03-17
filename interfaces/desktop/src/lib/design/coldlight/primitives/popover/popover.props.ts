import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Popover primitive shell. */
export interface PopoverPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
