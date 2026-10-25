/**
 * @file HStack Types
 * @kind hstack
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type HStackGap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "none";
export type HStackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type HStackJustify = "start" | "center" | "end" | "between" | "around";

export interface HStackProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	gap?: HStackGap;
	align?: HStackAlign;
	justify?: HStackJustify;
}
