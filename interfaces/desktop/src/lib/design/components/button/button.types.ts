/**
 * @file Button Component Types
 * @kind button
 *
 * DUMB component. Structure + ARIA + structural size.
 * ZERO visual. Visual comes from StyleMacro via ui/ wrapper.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ButtonType } from "$lib/design/primitives/button/button.types.js";

export type { ButtonType, UseButtonProps, UseButtonReturn } from "$lib/design/primitives/button/button.types.js";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled" | "type"> {
	class?: string;
	children?: Snippet;
	disabled?: boolean;
	type?: ButtonType;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	loading?: boolean;
	expanded?: boolean;
	size?: ButtonSize;
}
