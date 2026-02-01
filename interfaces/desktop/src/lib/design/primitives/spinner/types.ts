/**
 * @file Spinner Primitive Types
 * @description Structural type declarations for the spinner primitive.
 * Aligned to taxonomy contract: kind="spinner"
 * Slots: root
 * ariaStateProvider: "coldlight" — polite live region announcing loading state to assistive technology.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Spinner root — indeterminate loading indicator */
export interface SpinnerProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
