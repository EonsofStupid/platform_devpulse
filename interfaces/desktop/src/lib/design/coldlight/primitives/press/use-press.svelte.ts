/**
 * usePress — ColdLight interaction primitive.
 *
 * Tracks pointerdown → pointerup as a press interaction.
 * Handles cancel when pointer leaves the element before release.
 *
 * @example
 * ```svelte
 * <script>
 *   import { usePress } from '$lib/design/coldlight';
 *   const { pressed, pressProps } = usePress({ onPress: () => console.log('pressed!') });
 * </script>
 * <button {...pressProps}>Click me</button>
 * ```
 */

import type { UsePressProps, UsePressReturn } from "./press.types.js";

export function usePress(props: UsePressProps = {}): UsePressReturn {
	let isPressed = $state(false);

	function handlePointerDown(e: PointerEvent): void {
		if (props.disabled) return;
		isPressed = true;
		props.onPressStart?.(e);
		props.onPressChange?.(true);
	}

	function handlePointerUp(e: PointerEvent): void {
		if (props.disabled || !isPressed) return;
		isPressed = false;
		props.onPressEnd?.(e);
		props.onPressChange?.(false);
		props.onPress?.(e);
	}

	function handlePointerCancel(e: PointerEvent): void {
		if (!isPressed) return;
		isPressed = false;
		props.onPressEnd?.(e);
		props.onPressChange?.(false);
	}

	const pressProps = $derived({
		onpointerdown: handlePointerDown,
		onpointerup: handlePointerUp,
		onpointercancel: handlePointerCancel,
		onpointerleave: handlePointerCancel,
	});

	return {
		get pressed() {
			return isPressed;
		},
		get pressProps() {
			return pressProps;
		},
	};
}
