/**
 * useKeyboard — ColdLight interaction primitive.
 *
 * Thin wrapper that returns onkeydown/onkeyup event handlers.
 * Components compose this when they need keyboard interaction
 * without managing their own handler plumbing.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useKeyboard } from '$lib/design/coldlight';
 *   const { keyboardProps } = useKeyboard({
 *     onKeyDown: (e) => { if (e.key === 'Escape') close(); },
 *   });
 * </script>
 * <div {...keyboardProps} tabindex="0">Press Escape to close</div>
 * ```
 */

import type { UseKeyboardProps, UseKeyboardReturn } from "./keyboard-handler.types.js";

export function useKeyboard(props: UseKeyboardProps = {}): UseKeyboardReturn {
	const keyboardProps = $derived({
		onkeydown: props.onKeyDown,
		onkeyup: props.onKeyUp,
	});

	return {
		get keyboardProps() {
			return keyboardProps;
		},
	};
}
