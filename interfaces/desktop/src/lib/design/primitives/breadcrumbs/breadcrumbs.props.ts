import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Breadcrumbs primitive shell. */
export interface BreadcrumbsPrimitiveProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
}
