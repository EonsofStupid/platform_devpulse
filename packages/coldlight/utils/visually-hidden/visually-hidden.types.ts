/**
 * Visually hidden utility types.
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Returns Tailwind class string via cn().
 */

export interface UseVisuallyHiddenProps {
	/** If true, content becomes visible on focus (skip-link pattern). */
	isFocusable?: boolean;
}

export interface UseVisuallyHiddenReturn {
	/** Tailwind class string for sr-only / focusable sr-only. */
	readonly className: string;
}
