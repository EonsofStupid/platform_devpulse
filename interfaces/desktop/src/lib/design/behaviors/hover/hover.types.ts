import type { HTMLAttributes } from "svelte/elements";

export interface UseHoverProps {
	onHoverStart?: (e: PointerEvent) => void;
	onHoverEnd?: (e: PointerEvent) => void;
	onHoverChange?: (hovered: boolean) => void;
	disabled?: boolean;
}

export type HoverPropsAttrs = Pick<
	HTMLAttributes<HTMLElement>,
	"onpointerenter" | "onpointerleave"
>;

export interface UseHoverReturn {
	readonly hovered: boolean;
	readonly hoverProps: HoverPropsAttrs;
}
