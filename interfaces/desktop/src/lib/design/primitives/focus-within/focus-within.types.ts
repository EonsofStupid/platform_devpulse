import type { HTMLAttributes } from "svelte/elements";

export interface UseFocusWithinProps {
	onFocusWithin?: (e: FocusEvent) => void;
	onBlurWithin?: (e: FocusEvent) => void;
	onFocusWithinChange?: (focusedWithin: boolean) => void;
}

export type FocusWithinPropsAttrs = Pick<HTMLAttributes<HTMLElement>, "onfocusin" | "onfocusout">;

export interface UseFocusWithinReturn {
	readonly focusedWithin: boolean;
	readonly focusWithinProps: FocusWithinPropsAttrs;
}
