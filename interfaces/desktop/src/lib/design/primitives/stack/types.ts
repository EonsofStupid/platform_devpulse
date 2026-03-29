import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Cross-axis alignment values */
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";

/** Main-axis justification values */
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

/**
 * Structural props for the Stack primitive.
 *
 * A stack arranges children vertically with configurable gap and alignment.
 * The most common layout primitive. Pure layout — no ARIA semantics.
 * For horizontal layout, use Row instead.
 *
 * @example
 * ```svelte
 * <div {...stackAnatomy.attrs.root} class="gap-4">
 *   <p>First item</p>
 *   <p>Second item</p>
 * </div>
 * ```
 */
export interface StackPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the stack */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Gap between children. Tailwind gap value (e.g., "1", "2", "3", "4") */
	gap?: string;
	/** Cross-axis alignment */
	align?: StackAlign;
	/** Main-axis justification */
	justify?: StackJustify;
}
