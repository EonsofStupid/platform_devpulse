/**
 * @file Separator Types
 * @kind separator
 * @layer components
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorVariant = "solid" | "dashed" | "dotted";

export interface SeparatorProps
	extends Omit<HTMLAttributes<HTMLHRElement>, "style">,
		BaseProps,
		ColdLightProps {
	orientation?: SeparatorOrientation;
	decorative?: boolean;
	variant?: SeparatorVariant;
}
