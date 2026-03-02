/**
 * @file Banner Component Types
 * @kind banner
 * @layer components
 *
 * Extends primitive with ARIA state props, visual intent, and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type BannerIntent = "info" | "success" | "warning" | "error";

export const BANNER_INTENT_PRESETS: Record<BannerIntent, string> = {
	info: "banner-info",
	success: "banner-success",
	warning: "banner-warning",
	error: "banner-error",
};

/** Banner component props — ColdLight 8-axis + ARIA + recipe */
export interface BannerComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Visual intent — drives color + accent via recipe */
	intent?: BannerIntent;
	/** Whether the banner is visible */
	visible?: boolean;
	/** Called when visible state changes (e.g. on dismiss) */
	onVisibleChange?: (visible: boolean) => void;
}
