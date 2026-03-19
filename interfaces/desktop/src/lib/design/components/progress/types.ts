/**
 * @file Progress Types
 * @kind progress
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	value?: number | null;
	max?: number;
	size?: ProgressSize;
}
