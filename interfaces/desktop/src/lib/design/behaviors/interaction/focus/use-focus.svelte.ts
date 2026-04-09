/**
 * useFocus — ColdLight interaction primitive.
 *
 * Tracks focus/blur state on an element.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useFocus } from '$lib/design/coldlight';
 *   const { focused, focusProps } = useFocus({ onFocusChange: (f) => console.log(f) });
 * </script>
 * <input {...focusProps} />
 * ```
 */

import type { UseFocusProps, UseFocusReturn } from "./focus.types.js";

export function useFocus(props: UseFocusProps = {}): UseFocusReturn {
	let isFocused = $state(false);

	function handleFocus(e: FocusEvent): void {
		if (props.disabled) return;
		isFocused = true;
		props.onFocus?.(e);
		props.onFocusChange?.(true);
	}

	function handleBlur(e: FocusEvent): void {
		if (props.disabled) return;
		isFocused = false;
		props.onBlur?.(e);
		props.onFocusChange?.(false);
	}

	const focusProps = $derived({
		onfocus: handleFocus,
		onblur: handleBlur,
	});

	return {
		get focused() {
			return isFocused;
		},
		get focusProps() {
			return focusProps;
		},
	};
}
