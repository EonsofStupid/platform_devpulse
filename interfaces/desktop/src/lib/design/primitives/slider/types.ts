import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Slider orientation */
export type SliderOrientation = "horizontal" | "vertical";

/**
 * Structural props for the Slider primitive.
 *
 * A slider selects a continuous value by dragging a thumb along a track.
 * Supports single and range (dual thumb) modes. For discrete numeric input
 * with text entry, use NumberField instead.
 *
 * @example
 * ```svelte
 * <div {...sliderAnatomy.attrs.root}>
 *   <label {...sliderAnatomy.attrs.label}>Volume</label>
 *   <div {...sliderAnatomy.attrs.track}>
 *     <span {...sliderAnatomy.attrs.thumb} role="slider"
 *           aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} />
 *   </div>
 *   <output {...sliderAnatomy.attrs.output}>{value}%</output>
 * </div>
 * ```
 */
export interface SliderPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the slider */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current value (or [min, max] for range mode) */
	value?: number | number[];
	/** Callback when value changes */
	onChange?: (value: number | number[]) => void;
	/** Minimum value. Default: 0 */
	min?: number;
	/** Maximum value. Default: 100 */
	max?: number;
	/** Step increment. Default: 1 */
	step?: number;
	/** Slider orientation. Default: "horizontal" */
	orientation?: SliderOrientation;
	/** Disabled state */
	disabled?: boolean;
}
