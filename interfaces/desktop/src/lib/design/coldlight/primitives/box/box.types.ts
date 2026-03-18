/**
 * useBox — prop and return types.
 *
 * Generic box layout primitive. No props needed.
 */

export type UseBoxProps = Record<string, never>;

export interface UseBoxReturn {
	/** Spread onto the root element. */
	readonly root: Record<string, unknown>;
}
