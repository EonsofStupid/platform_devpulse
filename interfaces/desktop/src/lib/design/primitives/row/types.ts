import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Props for the Row primitive — horizontal flex layout. */
export interface RowPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	/** Gap between children. Tailwind gap value (e.g., "1", "2", "3", "4") */
	gap?: string;
	/** Cross-axis alignment */
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	/** Main-axis justification */
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	/** Wrap children when they overflow */
	wrap?: boolean;
}
