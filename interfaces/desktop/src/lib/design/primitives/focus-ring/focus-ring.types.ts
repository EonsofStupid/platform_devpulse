/**
 * useFocusRing — prop and return types.
 *
 * Distinguishes keyboard focus (Tab) from mouse focus (click).
 * isFocusVisible is true only for keyboard-initiated focus.
 */

export interface UseFocusRingProps {
	/** Whether the element should auto-focus on mount. */
	autoFocus?: boolean;
}

export interface UseFocusRingReturn {
	/** Whether focus was initiated by keyboard (Tab). */
	readonly isFocusVisible: boolean;
	/** Spread onto the target element. */
	readonly focusRingProps: Record<string, unknown>;
}
