/**
 * @file Separator Primitive Types
 * @description Structural type declarations for the separator primitive.
 * Aligned to taxonomy contract: kind="separator"
 * Slots: root
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Separator root — structural divider supporting horizontal/vertical orientation */
export interface SeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Visual orientation — sets data-orientation for CSS targeting */
	orientation?: "horizontal" | "vertical";
	/** When true, purely visual divider. When false, semantic separator (component layer adds ARIA). */
	decorative?: boolean;
	children?: Snippet;
}
