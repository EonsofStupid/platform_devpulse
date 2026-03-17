/**
 * useKeyboard — prop and return types.
 *
 * Thin wrapper that returns onkeydown/onkeyup event handlers.
 */

export interface UseKeyboardProps {
	/** Callback fired on keydown. */
	onKeyDown?: (e: KeyboardEvent) => void;
	/** Callback fired on keyup. */
	onKeyUp?: (e: KeyboardEvent) => void;
}

export interface UseKeyboardReturn {
	/** Spread onto the target element. */
	readonly keyboardProps: Record<string, unknown>;
}
