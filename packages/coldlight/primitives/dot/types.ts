import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Dot primitive.
 *
 * A dot is a small colored circle indicating status (online/offline,
 * active/inactive, severity). Decorative by default — provide aria-label
 * when the dot communicates meaningful information.
 *
 * @example
 * ```svelte
 * <span {...dotAnatomy.attrs.root} aria-hidden="true" />
 * <!-- or with meaning: -->
 * <span {...dotAnatomy.attrs.root} aria-label="Online" />
 * ```
 */
export interface DotPrimitiveProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	/** Additional CSS classes */
	class?: string;
	/** Dot diameter. Default: 0.5rem */
	size?: string;
	/** Dot color. CSS value or token var() reference */
	color?: string;
	/** Glow halo effect using the same color */
	glow?: boolean;
	/** Pulse animation for attention */
	animate?: boolean;
}
