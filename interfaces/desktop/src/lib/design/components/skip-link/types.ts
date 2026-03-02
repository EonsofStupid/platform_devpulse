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
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** SkipLink component props -- ColdLight 8-axis + ARIA + recipe + primitive */
export interface SkipLinkComponentProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Target element ID to skip to. @default "#main-content" */
	href?: string;
	/** Visible label text. @default "Skip to main content" */
	label?: string;
}
