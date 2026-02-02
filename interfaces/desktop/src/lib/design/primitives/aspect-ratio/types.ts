/**
 * @file AspectRatio Utility Types
 * @description Structural type declarations for the aspect-ratio utility.
 * This is a utility wrapper — no taxonomy contract, no context.
 * Provides a CSS aspect-ratio container shell.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** AspectRatio root — CSS aspect-ratio wrapper */
export interface AspectRatioProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
