import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Spacer primitive shell. */
export interface SpacerPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
