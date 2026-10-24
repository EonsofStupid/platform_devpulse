/**
 * @file Toaster Component Types
 * @kind toaster
 * @layer components
 *
 * Extends primitive with ColdLight visual props.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { ToasterPrimitiveProps } from "#coldlight/behaviors/overlays/toaster/index.js";

export type ToasterPreset = "default" | "stark" | "glass" | "flat" | "matte";

export type { ToasterPosition } from "#coldlight/behaviors/overlays/toaster/index.js";

/** Toaster component props — extends primitive + preset */
export interface ToasterComponentProps extends ToasterPrimitiveProps {
	/** Style preset. Default: "default". */
	preset?: ToasterPreset;
	/** Default auto-dismiss delay in ms. @default 5000 */
	closeDelay?: number;
}
