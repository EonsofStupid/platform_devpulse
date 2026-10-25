/**
 * @file Button Types
 * @kind button
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";
import type { ButtonSize } from "./recipe.js";

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

export const BUTTON_INTENT_PRESETS: Record<ButtonIntent, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
	danger: "btn-danger",
};

export type { ButtonSize };

export interface ButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled" | "type">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	loading?: boolean;
	expanded?: boolean;
	intent?: ButtonIntent;
	size?: ButtonSize;
}
