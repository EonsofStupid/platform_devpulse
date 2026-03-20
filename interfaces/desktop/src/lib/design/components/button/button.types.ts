/**
 * @file Button Types — All types for the Button component, colocated.
 * @kind button
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

// ── Hook types ──────────────────────────────────────────────────

export type ButtonType = "button" | "submit" | "reset";

export interface UseButtonProps {
	/** Whether the button is disabled. */
	disabled?: boolean;
	/** Whether the button is in a loading state (treated as disabled). */
	loading?: boolean;
	/** Toggle mode: the pressed state. `undefined` = not a toggle button. */
	pressed?: boolean;
	/** Callback when pressed state changes (toggle mode only). */
	onPressedChange?: (pressed: boolean) => void;
	/** Menu trigger mode: whether the controlled region is expanded. */
	expanded?: boolean;
	/** HTML button type attribute. Default: "button". */
	type?: ButtonType;
}

export interface UseButtonReturn {
	/** Spread onto the root `<button>` element. */
	readonly root: Record<string, unknown>;
	/** Current pressed state (toggle mode). */
	readonly pressed: boolean | undefined;
	/** Whether the button is functionally disabled (disabled OR loading). */
	readonly isDisabled: boolean;
	/** Programmatically press (toggle mode only). */
	press(): void;
	/** Programmatically unpress (toggle mode only). */
	unpress(): void;
	/** Programmatically toggle pressed state (toggle mode only). */
	toggle(): void;
}

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
