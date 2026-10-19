import type { HTMLAttributes } from "svelte/elements";

export interface UsePressProps {
	onPress?: (e: PointerEvent) => void;
	onPressStart?: (e: PointerEvent) => void;
	onPressEnd?: (e: PointerEvent) => void;
	onPressChange?: (pressed: boolean) => void;
	disabled?: boolean;
}

export type PressPropsAttrs = Pick<
	HTMLAttributes<HTMLElement>,
	"onpointerdown" | "onpointerup" | "onpointercancel" | "onpointerleave"
>;

export interface UsePressReturn {
	readonly pressed: boolean;
	readonly pressProps: PressPropsAttrs;
}
