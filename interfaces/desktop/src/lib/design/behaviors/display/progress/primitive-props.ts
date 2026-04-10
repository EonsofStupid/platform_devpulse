import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Progress primitive.
 *
 * A progress bar shows task completion. For determinate tasks, set `value`
 * between `min` and `max`. For indeterminate tasks (unknown duration),
 * omit `value` entirely. For scalar measurements (disk usage, temperature),
 * use Meter instead.
 *
 * @example
 * ```svelte
 * <div {...progressAnatomy.attrs.root} role="progressbar"
 *      aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}
 *      aria-label="Upload progress">
 *   <label {...progressAnatomy.attrs.label}>Uploading... 75%</label>
 *   <div {...progressAnatomy.attrs.track}>
 *     <div {...progressAnatomy.attrs.fill} style:width="75%" />
 *   </div>
 * </div>
 * ```
 */
export interface ProgressPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the progress */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current value. Omit or set null for indeterminate state. */
	value?: number | null;
	/** Minimum value. Default: 0 */
	min?: number;
	/** Maximum value. Default: 100 */
	max?: number;
	/** Whether progress is indeterminate (unknown completion). Default: false */
	indeterminate?: boolean;
	/** Human-readable value description (e.g., "75% complete") */
	valueText?: string;
}
