import type { HTMLAttributes } from "svelte/elements";

/** Separator orientation */
export type SeparatorOrientation = "horizontal" | "vertical";

/**
 * Structural props for the Separator primitive.
 *
 * A separator divides content sections visually. When `decorative` is true,
 * it renders as `role="none"` (invisible to assistive technology).
 * Otherwise it renders as `role="separator"` with `aria-orientation`.
 *
 * @example
 * ```svelte
 * <!-- Semantic separator -->
 * <div {...separatorAnatomy.attrs.root} role="separator" aria-orientation="horizontal" />
 *
 * <!-- Decorative separator -->
 * <div {...separatorAnatomy.attrs.root} role="none" />
 * ```
 */
export interface SeparatorPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Additional CSS classes */
	class?: string;
	/** Separator direction. Default: "horizontal" */
	orientation?: SeparatorOrientation;
	/** When true, separator is purely visual — role="none", invisible to screen readers */
	decorative?: boolean;
}
