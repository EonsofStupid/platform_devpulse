/**
 * @file VisuallyHidden Primitive Types
 * @description Structural type declarations for the visually-hidden utility primitive.
 * Aligned to taxonomy contract: kind="visually-hidden"
 * Slots: root
 * ariaStateProvider: "coldlight" — CSS-only screen-reader utility, zero JS behavior.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** VisuallyHidden root — screen-reader-only content wrapper */
export interface VisuallyHiddenProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
