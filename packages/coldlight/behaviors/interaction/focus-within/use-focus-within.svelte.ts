/**
 * useFocusWithin — ColdLight interaction primitive.
 *
 * Tracks whether any descendant of the container has focus.
 * Uses focusin/focusout and checks relatedTarget to determine
 * whether focus moved within the container or left it entirely.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useFocusWithin } from '#coldlight/coldlight';
 *   const { focusedWithin, focusWithinProps } = useFocusWithin({
 *     onFocusWithinChange: (within) => console.log('focus within:', within),
 *   });
 * </script>
 * <div {...focusWithinProps}>
 *   <input />
 *   <button>Submit</button>
 * </div>
 * ```
 */

import type { UseFocusWithinProps, UseFocusWithinReturn } from "./focus-within.types.js";

export function useFocusWithin(props: UseFocusWithinProps = {}): UseFocusWithinReturn {
	let isFocusedWithin = $state(false);

	function handleFocusIn(e: FocusEvent): void {
		if (isFocusedWithin) return;
		isFocusedWithin = true;
		props.onFocusWithin?.(e);
		props.onFocusWithinChange?.(true);
	}

	function handleFocusOut(e: FocusEvent): void {
		if (!isFocusedWithin) return;
		const container = e.currentTarget as HTMLElement;
		const relatedTarget = e.relatedTarget as Node | null;

		// If focus moved to another element within the container, stay focused.
		if (relatedTarget && container.contains(relatedTarget)) return;

		isFocusedWithin = false;
		props.onBlurWithin?.(e);
		props.onFocusWithinChange?.(false);
	}

	const focusWithinProps = $derived({
		onfocusin: handleFocusIn,
		onfocusout: handleFocusOut,
	});

	return {
		get focusedWithin() {
			return isFocusedWithin;
		},
		get focusWithinProps() {
			return focusWithinProps;
		},
	};
}
