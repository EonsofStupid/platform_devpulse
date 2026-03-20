/**
 * useHover — prop and return types.
 *
 * Tracks pointer hover interactions, ignoring touch devices.
 */

export interface UseHoverProps {
	/** Callback fired when hover starts. */
	onHoverStart?: (e: PointerEvent) => void;
	/** Callback fired when hover ends. */
	onHoverEnd?: (e: PointerEvent) => void;
	/** Callback fired when hovered state changes. */
	onHoverChange?: (hovered: boolean) => void;
	/** Whether the hover interaction is disabled. */
	disabled?: boolean;
}

export interface HoverPropsAttrs {
	onpointerenter: (e: PointerEvent) => void;
	onpointerleave: (e: PointerEvent) => void;
}

export interface UseHoverReturn {
	/** Whether the element is currently hovered. */
	readonly hovered: boolean;
	/** Spread onto the target element. */
	readonly hoverProps: HoverPropsAttrs;
}
