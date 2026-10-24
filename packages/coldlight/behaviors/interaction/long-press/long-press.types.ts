import type { HTMLAttributes } from "svelte/elements";

export interface UseLongPressProps {
	onLongPress?: (e: PointerEvent) => void;
	threshold?: number;
	disabled?: boolean;
}

export type LongPressPropsAttrs = Pick<
	HTMLAttributes<HTMLElement>,
	"onpointerdown" | "onpointerup" | "onpointercancel" | "onpointerleave"
>;

export interface UseLongPressReturn {
	readonly longPressProps: LongPressPropsAttrs;
}
