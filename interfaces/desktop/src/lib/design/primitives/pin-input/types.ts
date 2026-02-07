/**
 * @file PinInput Primitive Types
 * @description Structural type declarations for the pin-input primitive.
 * Aligned to taxonomy contract: kind="pin-input"
 * Slots: root, input (self-closing)
 * ariaStateProvider: "meltui" — createPinInput provides auto-advance, backspace navigation, and paste handling.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** PinInput root — container for a group of single-character inputs */
export interface PinInputProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** PinInput input — individual character input (self-closing, no children) */
export interface PinInputInputProps extends OmitStyle<HTMLInputElement>, BaseProps {}
