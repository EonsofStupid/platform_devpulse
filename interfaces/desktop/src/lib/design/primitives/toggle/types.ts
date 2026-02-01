/**
 * @file Toggle Primitive Types
 * @description Structural type declarations for the toggle primitive.
 * Aligned to taxonomy contract: kind="toggle"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Toggle root — pressable button with on/off state */
export interface ToggleProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** Pressed state (bindable) */
	pressed?: boolean;
	children?: Snippet;
}
