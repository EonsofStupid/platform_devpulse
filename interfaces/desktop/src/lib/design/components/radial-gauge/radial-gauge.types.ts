/**
 * @file RadialGauge Types
 * @kind radial-gauge
 * @render svg
 * @category data-viz
 */

import type { SvgAccent, SvgIntent } from "$lib/design/svg/svg-types.js";

export interface RadialGaugeProps {
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
	/** Additional CSS classes on wrapper */
	class?: string;
}
