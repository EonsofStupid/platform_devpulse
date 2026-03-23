/**
 * @file Separator Types
 * @kind separator
 * @layer components
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorVariant = "solid" | "dashed" | "dotted";

export interface SeparatorProps
	extends Omit<HTMLAttributes<HTMLHRElement>, "style">,
		BaseProps,
		ComponentProps {
	orientation?: SeparatorOrientation;
	decorative?: boolean;
	variant?: SeparatorVariant;
}
