/**
 * @file Banner Component Types
 * @kind banner
 * @layer components
 *
 * Banner is a sticky/fixed layout container for site-wide announcements,
 * marketing CTAs, cookie consent, notifications. NOT an alert — see Alert
 * for inline contextual feedback with role="alert".
 *
 * No matching primitive — uses UIBaseProps.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// CALLBACK DETAILS
// =============================================================================

/** Details passed to onOpenChange callback. */
export interface BannerOpenChangeDetails {
	/** The new open state. */
	open: boolean;
}

// =============================================================================
// BANNER ROOT
// =============================================================================

/** Viewport edge the banner sticks to. */
export type BannerPosition = "top" | "bottom";
export type BannerPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Element IDs for composition. */
export interface BannerIds {
	root?: string;
	dismiss?: string;
}

/** Props for the ColdLight Banner component. */
export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children">, UIBaseProps {
	/** Element IDs for composition. */
	ids?: Partial<BannerIds>;
	/** Controlled open state. */
	open?: boolean;
	/** Initial open state when uncontrolled. Default: true. */
	defaultOpen?: boolean;
	/** Callback when open state changes. */
	onOpenChange?: (details: BannerOpenChangeDetails) => void;
	/** Callback when the exit animation/transition completes. */
	onExitComplete?: () => void;
	/** Viewport edge: "top" (default) or "bottom". */
	position?: BannerPosition;
	/** Whether the banner is disabled (non-interactive dismiss). */
	disabled?: boolean;
	/** Text/writing direction. Default: "ltr". */
	dir?: "ltr" | "rtl";
	/** Whether to show the built-in dismiss button. Default: true. */
	dismissible?: boolean;
	/** Visual preset — selects the style preset */
	preset?: BannerPreset;
	/** Content snippet. */
	children?: Snippet;
	/** Override the dismiss button rendering. */
	dismiss?: Snippet;
}
