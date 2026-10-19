/**
 * @file SparkLine Types
 * @kind spark-line
 * @render svg
 * @category data-viz
 */

import type { UIBaseProps } from "#coldlight/components/_base/types.js";
import type { SvgAccent, SvgIntent } from "#coldlight/svg/svg-types.js";

export interface SparkLineProps extends UIBaseProps {
	/** Data points (y-values) */
	data?: number[];
	/** Accent hue — drives stroke, glow, fill color */
	accent?: SvgAccent;
	/** Visual preset — resolved to preset */
	preset?: SvgIntent;
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
}
