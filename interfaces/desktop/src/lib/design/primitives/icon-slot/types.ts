import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the IconSlot primitive.
 *
 * An icon slot provides consistent sizing for icon content within components.
 * Always decorative — hidden from assistive technology via aria-hidden="true".
 * When an icon carries meaning, the PARENT element provides the accessible name.
 *
 * @example
 * ```svelte
 * <span {...iconSlotAnatomy.attrs.root} aria-hidden="true">
 *   <svg>...</svg>
 * </span>
 * ```
 */
export interface IconSlotPrimitiveProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	/** Snippet content (icon SVG or component) */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Icon size class. Default: inherits from parent */
	size?: string;
}
