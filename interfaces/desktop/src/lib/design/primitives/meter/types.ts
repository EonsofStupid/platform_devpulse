import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Meter primitive.
 *
 * A meter displays a scalar value within a known range (e.g., disk usage,
 * password strength). NOT for task completion — use Progress for that.
 * Meter supports optimum/low/high thresholds for automatic color coding.
 *
 * @example
 * ```svelte
 * <div {...meterAnatomy.attrs.root} role="meter"
 *      aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}
 *      aria-label="Disk usage">
 *   <label {...meterAnatomy.attrs.label}>Disk usage</label>
 *   <div {...meterAnatomy.attrs.track}>
 *     <div {...meterAnatomy.attrs.fill} style:width="75%" />
 *   </div>
 * </div>
 * ```
 */
export interface MeterPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the meter */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current value */
	value?: number;
	/** Minimum value. Default: 0 */
	min?: number;
	/** Maximum value. Default: 100 */
	max?: number;
	/** Optimal value — determines color zone */
	optimum?: number;
	/** Low threshold — values below this are in the low zone */
	low?: number;
	/** High threshold — values above this are in the high zone */
	high?: number;
	/** Human-readable value description (e.g., "75% full") */
	valueText?: string;
}
