/**
 * @file RadialGauge Types
 * @kind radial-gauge
 * @render svg
 * @category data-viz
 */

import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";
import type { SvgAccent, SvgIntent } from "#coldlight/svg/svg-types.js";

export interface RadialGaugeProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "children" | "class"> {
	/** Current value */
	value?: number;
	/** Maximum value */
	max?: number;
	/** Gauge label (displayed below value) */
	label?: string;
	/** Display unit (e.g., "%", "GB") */
	unit?: string;
	/** Accent hue — drives stroke, glow, text color */
	accent?: SvgAccent;
	/** Visual preset — resolved to preset (default, glass, stark, flat, matte) */
	preset?: SvgIntent;
	/** Diameter in px (structural, not a visual axis) */
	size?: number;
	/** Ring stroke width in px (structural override) */
	strokeWidth?: number;
}
