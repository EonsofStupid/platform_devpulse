/**
 * @file LoadingOverlay Component Types
 * @kind loading-overlay
 * @layer components
 *
 * Extends primitive with visible state and accessible label.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { LoadingOverlayPrimitiveProps } from "$lib/design/behaviors/display/loading-overlay/index.js";

export type LoadingOverlayPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** LoadingOverlay component props — extends primitive + preset */
export interface LoadingOverlayComponentProps extends LoadingOverlayPrimitiveProps {
	/** Style preset */
	preset?: LoadingOverlayPreset;
	/** Called when visible state changes */
	onVisibleChange?: (visible: boolean) => void;
}
