import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Cross-axis alignment values */
export type RowAlign = "start" | "center" | "end" | "stretch" | "baseline";

/** Main-axis justification values */
export type RowJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

/**
 * Structural props for the Row primitive.
 *
 * A row arranges children horizontally with configurable gap, alignment,
 * and wrapping. Pure layout — no ARIA semantics. For vertical layout,
 * use Stack instead.
 *
 * @example
 * ```svelte
 * <div {...rowAnatomy.attrs.root} class="gap-2">
 *   <span>Left</span>
 *   <span>Right</span>
 * </div>
 * ```
 */
export interface RowPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the row */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Gap between children. Tailwind gap value (e.g., "1", "2", "3", "4") */
	gap?: string;
	/** Cross-axis alignment */
	align?: RowAlign;
	/** Main-axis justification */
	justify?: RowJustify;
	/** Wrap children when they overflow */
	wrap?: boolean;
}
