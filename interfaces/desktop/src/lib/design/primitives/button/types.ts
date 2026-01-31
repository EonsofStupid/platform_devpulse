/**
 * @file Button Primitive Types
 * @description Structural type declarations for the button primitive.
 * Aligned to taxonomy contract: kind="button", slots=[root, icon, label]
 * ariaStateProvider: "coldlight" — native <button> handles ARIA.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Button primitive props — structural shell */
export interface ButtonProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** HTML disabled state */
	disabled?: boolean;
	/** Content */
	children?: Snippet;
}
