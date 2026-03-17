import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw AlertDialog primitive shell. */
export interface AlertDialogPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
