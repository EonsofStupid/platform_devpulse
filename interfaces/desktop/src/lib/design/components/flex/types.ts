/**
 * @file Flex Component Types
 * @kind flex
 * @layer components
 *
 * Flexbox layout container with direction, wrap, gap, align, justify props.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
export type FlexGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

/** Flex component props — flexbox layout + ColdLight 8-axis */
export interface FlexComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Flex direction */
	direction?: FlexDirection;
	/** Enable flex wrap */
	wrap?: boolean;
	/** Gap between items */
	gap?: FlexGap;
	/** Cross-axis alignment */
	align?: FlexAlign;
	/** Main-axis distribution */
	justify?: FlexJustify;
	/** Polymorphic element tag */
	as?: "div" | "section" | "article" | "aside" | "nav" | "header" | "footer";
}
