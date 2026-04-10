/**
 * @file Meter Types
 * @kind meter
 * @layer components
 */

import type { MeterPrimitiveProps } from "$lib/design/behaviors/display/meter/index.js";

export type MeterPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface MeterProps extends MeterPrimitiveProps {
	/** Current value */
	value?: number;
	/** Minimum value. Default: 0 */
	min?: number;
	/** Maximum value. Default: 100 */
	max?: number;
	/** Optimal value */
	optimum?: number;
	/** Low threshold */
	low?: number;
	/** High threshold */
	high?: number;
	/** Label text */
	label?: string;
	/** Human-readable value text formatter */
	getValueText?: (value: number, percent: number) => string;
	/** Visual preset */
	preset?: MeterPreset;
	/** Accessible label */
	"aria-label"?: string;
	/** Accessible label reference */
	"aria-labelledby"?: string;
}
