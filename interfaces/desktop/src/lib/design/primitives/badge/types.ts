import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Badge primitive.
 *
 * A badge is a compact inline indicator for status, counts, or categories.
 * Non-interactive by default. Visual variants (size, color) are component
 * concerns handled via presets — not primitive props.
 *
 * @example
 * ```svelte
 * <span {...badgeAnatomy.attrs.root} aria-label="3 notifications">
 *   <span {...badgeAnatomy.attrs.label}>3</span>
 * </span>
 * ```
 */
export interface BadgePrimitiveProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	/** Snippet content rendered inside the badge */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** When provided, badge becomes removable — fires when user dismisses */
	onRemove?: () => void;
}
