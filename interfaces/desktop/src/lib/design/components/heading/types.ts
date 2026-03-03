/**
 * @file Heading Types
 * @kind heading
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children">, BaseProps, Omit<ColdLightProps, "size"> {
	children?: Snippet;
	level?: HeadingLevel;
	size?: HeadingSize;
}
