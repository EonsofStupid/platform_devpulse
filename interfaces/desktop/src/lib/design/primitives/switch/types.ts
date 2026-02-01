/**
 * @file Switch Primitive Types
 * @description Structural type declarations for the switch primitive.
 * Aligned to taxonomy contract: kind="switch"
 * Slots: root, thumb
 * ariaStateProvider: "coldlight" — native <button> with role="switch" + aria-checked at component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Switch root — toggle button with on/off state */
export interface SwitchProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** Checked state (bindable) */
	checked?: boolean;
	children?: Snippet;
}

/** Switch thumb — visual indicator that slides between checked/unchecked */
export interface SwitchThumbProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
