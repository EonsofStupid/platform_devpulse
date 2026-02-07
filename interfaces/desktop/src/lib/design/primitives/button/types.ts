/**
 * @file Button Primitive Types
 * @description Structural type declarations for the button primitive.
 * Aligned to taxonomy contract: kind="button", slots=[root, icon, label]
 * ariaStateProvider: "coldlight" — native <button> handles ARIA.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Button root — interactive command element */
export interface ButtonProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** HTML disabled state */
	disabled?: boolean;
	/** Toggle pressed state (for toggle buttons) */
	pressed?: boolean;
	/** Loading/busy state */
	loading?: boolean;
	children?: Snippet;
}

/** Button icon — decorative icon wrapper */
export interface ButtonIconProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

/** Button label — text label wrapper */
export interface ButtonLabelProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
