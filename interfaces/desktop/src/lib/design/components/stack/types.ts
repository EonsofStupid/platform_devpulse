/**
 * @file Stack Types
 * @kind stack
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type StackGap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "none";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";

export interface StackProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	gap?: StackGap;
	align?: StackAlign;
}
