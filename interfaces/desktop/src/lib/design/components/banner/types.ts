/**
 * @file Banner Component Types
 * @kind banner
 * @layer components
 *
 * ARIA + state only. ZERO visual.
 * Visual props (intent presets, ColdLightProps) belong in ui/banner/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type BannerIntent = "info" | "success" | "warning" | "error";

/** Banner component props — ARIA + state only. ZERO visual. */
export interface BannerComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic intent — drives ARIA state */
	intent?: BannerIntent;
	/** Whether the banner is visible */
	visible?: boolean;
	/** Called when visible state changes (e.g. on dismiss) */
	onVisibleChange?: (visible: boolean) => void;
}
