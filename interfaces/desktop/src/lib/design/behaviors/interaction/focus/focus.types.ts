import type { HTMLAttributes } from "svelte/elements";

export interface UseFocusProps {
	onFocus?: (e: FocusEvent) => void;
	onBlur?: (e: FocusEvent) => void;
	onFocusChange?: (focused: boolean) => void;
	disabled?: boolean;
}

export type FocusPropsAttrs = Pick<HTMLAttributes<HTMLElement>, "onfocus" | "onblur">;

export interface UseFocusReturn {
	readonly focused: boolean;
	readonly focusProps: FocusPropsAttrs;
}
