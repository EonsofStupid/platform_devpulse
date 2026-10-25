/**
 * useFocus — prop and return types.
 *
 * Tracks focus/blur on an element.
 */

export interface UseFocusProps {
	/** Callback fired when the element receives focus. */
	onFocus?: (e: FocusEvent) => void;
	/** Callback fired when the element loses focus. */
	onBlur?: (e: FocusEvent) => void;
	/** Callback fired when focused state changes. */
	onFocusChange?: (focused: boolean) => void;
	/** Whether the focus interaction is disabled. */
	disabled?: boolean;
}

export interface UseFocusReturn {
	/** Whether the element is currently focused. */
	readonly focused: boolean;
	/** Spread onto the target element. */
	readonly focusProps: Record<string, unknown>;
}
