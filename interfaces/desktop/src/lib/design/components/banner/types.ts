/**
 * @file Banner Types
 * @kind banner
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type BannerIntent = "info" | "success" | "warning" | "error";

export const BANNER_INTENT_PRESETS: Record<BannerIntent, string> = {
	info: "banner-info",
	success: "banner-success",
	warning: "banner-warning",
	error: "banner-error",
};

export interface BannerProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	intent?: BannerIntent;
	visible?: boolean;
	onVisibleChange?: (visible: boolean) => void;
}
