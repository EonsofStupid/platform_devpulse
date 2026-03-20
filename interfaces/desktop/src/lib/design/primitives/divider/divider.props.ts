import type { HTMLAttributes } from "svelte/elements";

/** Props for the raw Divider primitive shell. */
export interface DividerPrimitiveProps extends Omit<HTMLAttributes<HTMLHRElement>, "style"> {
	class?: string;
}
