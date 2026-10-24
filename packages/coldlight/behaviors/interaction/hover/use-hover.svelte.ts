/**
 * useHover — ColdLight interaction primitive.
 *
 * Tracks pointerenter/pointerleave for hover state.
 * Ignores touch devices (pointerType !== "mouse") to avoid
 * false hover states on mobile.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useHover } from '#coldlight/coldlight';
 *   const { hovered, hoverProps } = useHover({ onHoverChange: (h) => console.log(h) });
 * </script>
 * <div {...hoverProps}>Hover me</div>
 * ```
 */

import type { UseHoverProps, UseHoverReturn } from "./hover.types.js";

export function useHover(props: UseHoverProps = {}): UseHoverReturn {
	let isHovered = $state(false);

	function handlePointerEnter(e: PointerEvent): void {
		if (props.disabled || e.pointerType !== "mouse") return;
		isHovered = true;
		props.onHoverStart?.(e);
		props.onHoverChange?.(true);
	}

	function handlePointerLeave(e: PointerEvent): void {
		if (props.disabled || e.pointerType !== "mouse") return;
		isHovered = false;
		props.onHoverEnd?.(e);
		props.onHoverChange?.(false);
	}

	const hoverProps = $derived({
		onpointerenter: handlePointerEnter,
		onpointerleave: handlePointerLeave,
	});

	return {
		get hovered() {
			return isHovered;
		},
		get hoverProps() {
			return hoverProps;
		},
	};
}
