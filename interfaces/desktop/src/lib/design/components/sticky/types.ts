/**
 * @file Sticky Component Types
 * @kind sticky
 * @layer components
 *
 * Position sticky wrapper with top offset and z-index props.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type StickyTop = "0" | "1" | "2" | "4" | "8" | "16";
export type StickyOffset = "none" | "sm" | "md" | "lg";

/** Sticky component props — position sticky wrapper + ColdLight 8-axis */
export interface StickyComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Top offset for sticky positioning */
	top?: StickyTop;
	/** Z-index offset */
	offset?: StickyOffset;
}
