import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Separator primitive shell. */
export interface SeparatorPrimitiveProps extends Omit<HTMLAttributes<HTMLHRElement>, "style"> {
	class?: string;
}
