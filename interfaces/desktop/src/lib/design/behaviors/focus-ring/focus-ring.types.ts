import type { HTMLAttributes } from "svelte/elements";

export interface UseFocusRingProps {
	autoFocus?: boolean;
}

export type FocusRingPropsAttrs = Pick<HTMLAttributes<HTMLElement>, "onfocus" | "onblur" | "autofocus"> & {
	"data-focus-visible"?: "";
};

export interface UseFocusRingReturn {
	readonly isFocusVisible: boolean;
	readonly focusRingProps: FocusRingPropsAttrs;
}
