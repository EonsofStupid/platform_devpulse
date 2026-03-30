/**
 * @file Spinner Types
 * @kind spinner
 * @layer components
 */

import type { SpinnerPrimitiveProps } from "$lib/design/primitives/spinner/index.js";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SpinnerProps extends SpinnerPrimitiveProps {
	active?: boolean;
	size?: SpinnerSize;
	/** Style preset. Default: "default". */
	preset?: SpinnerPreset;
}
