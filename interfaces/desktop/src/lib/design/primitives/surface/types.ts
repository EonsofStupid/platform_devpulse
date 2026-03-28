import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Valid semantic elements for Surface. */
export type SurfaceElement =
	| "div"
	| "section"
	| "article"
	| "aside"
	| "main"
	| "footer"
	| "header"
	| "nav";

/** Props for the Surface primitive — universal semantic container. */
export interface SurfaceProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	/** Semantic HTML element to render. Default: "div" */
	as?: SurfaceElement;
	children?: Snippet;
	class?: string;
}
