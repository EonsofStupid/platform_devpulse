/**
 * useLongPress — prop and return types.
 *
 * Fires a callback when an element is pressed and held past a threshold.
 */

export interface UseLongPressProps {
	/** Callback fired when the long press threshold is reached. */
	onLongPress?: (e: PointerEvent) => void;
	/** Duration in ms before the long press fires. Default: 500. */
	threshold?: number;
	/** Whether the long press interaction is disabled. */
	disabled?: boolean;
}

export interface UseLongPressReturn {
	/** Spread onto the target element. */
	readonly longPressProps: Record<string, unknown>;
}
