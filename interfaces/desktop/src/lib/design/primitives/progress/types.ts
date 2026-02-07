/**
 * @file Progress Primitive Types
 * @description Structural type declarations for the progress primitive.
 * Aligned to taxonomy contract: kind="progress"
 * Slots: root (track), indicator (fill)
 * ariaStateProvider: "coldlight" — native range widget, direct ARIA application.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Progress root — track container for the progress bar */
export interface ProgressProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Progress indicator — fill element representing current value */
export interface ProgressIndicatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
