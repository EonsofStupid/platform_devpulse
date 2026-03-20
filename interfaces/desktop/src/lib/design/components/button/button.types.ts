/**
 * @file Button Component Types
 * @kind button
 * @layer components
 *
 * Hook types re-exported from coldlight/primitives/button.
 * Component-specific types (intent, size, props) defined here.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { ButtonType } from "$lib/design/coldlight/primitives/button/button.types.js";

// Re-export hook types so consumers can import from one place
export type { ButtonType, UseButtonProps, UseButtonReturn } from "$lib/design/coldlight/primitives/button/button.types.js";

// ── Component types ─────────────────────────────────────────────

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

export const BUTTON_INTENT_PRESETS: Record<ButtonIntent, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
	danger: "btn-danger",
};

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled" | "type">,
		ColdLightProps {
	class?: string;
	children?: Snippet;
	disabled?: boolean;
	type?: ButtonType;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	loading?: boolean;
	expanded?: boolean;
	intent?: ButtonIntent;
	size?: ButtonSize;
}
