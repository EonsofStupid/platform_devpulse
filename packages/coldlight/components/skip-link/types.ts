/**
 * @file SkipLink Component Types
 * @kind skip-link
 * @layer components
 *
 * Extends primitive with ARIA label, href target, and focus management.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { SkipLinkPrimitiveProps } from "#coldlight/behaviors/navigation/skip-link/index.js";

export type SkipLinkPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** SkipLink component props — extends primitive + preset */
export interface SkipLinkComponentProps extends SkipLinkPrimitiveProps {
	/** Visible label text. @default "Skip to main content" */
	label?: string;
	/** Style preset. Default: "default". */
	preset?: SkipLinkPreset;
}
