/**
 * usePress — prop and return types.
 *
 * Tracks pointer press interactions (pointerdown → pointerup).
 */

export interface UsePressProps {
	/** Callback fired on a complete press (pointerdown + pointerup). */
	onPress?: (e: PointerEvent) => void;
	/** Callback fired when a press starts (pointerdown). */
	onPressStart?: (e: PointerEvent) => void;
	/** Callback fired when a press ends (pointerup or cancel). */
	onPressEnd?: (e: PointerEvent) => void;
	/** Callback fired when pressed state changes. */
	onPressChange?: (pressed: boolean) => void;
	/** Whether the press interaction is disabled. */
	disabled?: boolean;
}

export interface PressPropsAttrs {
	onpointerdown: (e: PointerEvent) => void;
	onpointerup: (e: PointerEvent) => void;
	onpointercancel: (e: PointerEvent) => void;
	onpointerleave: (e: PointerEvent) => void;
}

export interface UsePressReturn {
	/** Whether a press is currently active. */
	readonly pressed: boolean;
	/** Spread onto the target element. */
	readonly pressProps: PressPropsAttrs;
}
