/**
 * useFocusWithin — prop and return types.
 *
 * Tracks whether focus is within a container element,
 * using focusin/focusout with relatedTarget checks.
 */

export interface UseFocusWithinProps {
	/** Callback fired when focus enters the container. */
	onFocusWithin?: (e: FocusEvent) => void;
	/** Callback fired when focus leaves the container. */
	onBlurWithin?: (e: FocusEvent) => void;
	/** Callback fired when focusedWithin state changes. */
	onFocusWithinChange?: (focusedWithin: boolean) => void;
}

export interface UseFocusWithinReturn {
	/** Whether focus is currently within the container. */
	readonly focusedWithin: boolean;
	/** Spread onto the container element. */
	readonly focusWithinProps: Record<string, unknown>;
}
