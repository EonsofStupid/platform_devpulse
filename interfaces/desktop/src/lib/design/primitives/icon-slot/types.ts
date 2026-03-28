import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the IconSlot primitive — container for icon content. */
export interface IconSlotPrimitiveProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	/** Icon size class. Default: inherits from parent */
	size?: string;
}
