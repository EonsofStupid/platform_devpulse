/**
 * useLongPress — ColdLight interaction primitive.
 *
 * Starts a timer on pointerdown. If held past the threshold, fires onLongPress.
 * Cancels if released or pointer leaves before the threshold.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useLongPress } from '$lib/design/coldlight';
 *   const { longPressProps } = useLongPress({ onLongPress: () => alert('held!'), threshold: 600 });
 * </script>
 * <button {...longPressProps}>Hold me</button>
 * ```
 */

import type { UseLongPressProps, UseLongPressReturn } from "./long-press.types.js";

export function useLongPress(props: UseLongPressProps = {}): UseLongPressReturn {
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let activeEvent: PointerEvent | null = null;

	function clear(): void {
		if (timerId !== null) {
			clearTimeout(timerId);
			timerId = null;
		}
		activeEvent = null;
	}

	function handlePointerDown(e: PointerEvent): void {
		if (props.disabled) return;
		clear();
		activeEvent = e;
		const threshold = props.threshold ?? 500;
		timerId = setTimeout(() => {
			if (activeEvent) {
				props.onLongPress?.(activeEvent);
			}
			clear();
		}, threshold);
	}

	function handlePointerUp(): void {
		clear();
	}

	function handlePointerCancel(): void {
		clear();
	}

	const longPressProps = $derived({
		onpointerdown: handlePointerDown,
		onpointerup: handlePointerUp,
		onpointercancel: handlePointerCancel,
		onpointerleave: handlePointerCancel,
	});

	return {
		get longPressProps() {
			return longPressProps;
		},
	};
}
