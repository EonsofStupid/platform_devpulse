/**
 * @file SparkLine Types
 * @kind spark-line
 * @render svg
 * @category data-viz
 */

import type { SvgAccent, SvgIntent } from "$lib/design/svg/svg-types.js";

export interface SparkLineProps {
	/** Data points (y-values) */
	data?: number[];
	/** Accent hue — drives stroke, glow, fill color */
	accent?: SvgAccent;
	/** Visual intent — resolved to preset */
	intent?: SvgIntent;
	/** Chart width in px (structural) */
	width?: number;
	/** Chart height in px (structural) */
	height?: number;
	/** Show area fill under the line */
	area?: boolean;
	/** Line stroke width override in px */
	lineWidth?: number;
	/** Show glow effect on the line */
	glow?: boolean;
	/** Additional CSS classes */
	class?: string;
}
