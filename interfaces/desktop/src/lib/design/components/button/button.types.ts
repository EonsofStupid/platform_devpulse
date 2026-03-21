/**
 * @file Button Component Types
 * @kind button
 * @layer components
 *
 * DUMB component. Structural + ARIA only.
 * Visual treatment via class prop (StyleMacro or direct v-* utilities).
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ButtonType } from "$lib/design/primitives/button/button.types.js";

export type { ButtonType, UseButtonProps, UseButtonReturn } from "$lib/design/primitives/button/button.types.js";

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled" | "type"> {
	/** CSS classes — structural + visual from caller */
	class?: string;
	/** Children snippet */
	children?: Snippet;
	/** Disabled state */
	disabled?: boolean;
	/** Button type attribute */
	type?: ButtonType;
	/** Toggle pressed state */
	pressed?: boolean;
	/** Pressed state change callback */
	onPressedChange?: (pressed: boolean) => void;
	/** Loading state */
	loading?: boolean;
	/** Expanded state (menu trigger) */
	expanded?: boolean;
	/** Semantic intent — drives recipe structural classes */
	intent?: ButtonIntent;
	/** Size — drives recipe structural classes */
	size?: ButtonSize;
}
