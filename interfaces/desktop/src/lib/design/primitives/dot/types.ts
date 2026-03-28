import type { HTMLAttributes } from "svelte/elements";

/** Props for the Dot primitive — colored circle indicator. */
export interface DotPrimitiveProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	class?: string;
	/** Dot diameter. Default: 0.5rem */
	size?: string;
	/** Dot color. CSS value or var() reference */
	color?: string;
	/** Glow halo using the same color */
	glow?: boolean;
	/** Pulse animation */
	animate?: boolean;
}
