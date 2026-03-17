/**
 * useBox — prop and return types.
 *
 * Generic box layout primitive. No props needed.
 */

export interface UseBoxProps {
	/* No props required for box layout. */
}

export interface UseBoxReturn {
	/** Spread onto the root element. */
	readonly root: Record<string, unknown>;
}
