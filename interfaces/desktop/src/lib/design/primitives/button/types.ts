import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ButtonType } from "$lib/design/behaviors/button/button.types.js";

/** Props for the Button primitive. */
export interface ButtonPrimitiveProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	class?: string;
	disabled?: boolean;
	loading?: boolean;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	expanded?: boolean;
	type?: ButtonType;
}
