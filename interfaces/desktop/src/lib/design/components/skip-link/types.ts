/**
 * @file SkipLink Component Types
 * @kind skip-link
 * @layer components
 *
 * Extends primitive with ARIA label, href target, and focus management.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SkipLinkPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** SkipLink component props -- ColdLight 8-axis + ARIA + composition + primitive */
export interface SkipLinkComponentProps
	extends Omit<HTMLAnchorAttributes, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Target element ID to skip to. @default "#main-content" */
	href?: string;
	/** Visible label text. @default "Skip to main content" */
	label?: string;
	/** Style preset. Default: "default". */
	preset?: SkipLinkPreset;
}
