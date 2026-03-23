/**
 * @file Button Types
 * @kind button
 */

import type { HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { ButtonType } from "$lib/design/primitives/button/button.types.js";

export type { ButtonType } from "$lib/design/primitives/button/button.types.js";

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
	extends ComponentProps,
		Omit<HTMLButtonAttributes, "style" | "children" | "class" | "disabled" | "type"> {
	intent?: ButtonIntent;
	size?: ButtonSize;
	disabled?: boolean;
	type?: ButtonType;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	loading?: boolean;
	expanded?: boolean;
}
