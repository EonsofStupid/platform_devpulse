import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Slider orientation */
export type ColorSliderOrientation = "horizontal" | "vertical";

/**
 * Structural props for the ColorSlider primitive.
 *
 * A color slider controls one color channel via a draggable thumb on a
 * gradient track. For full color picking, compose multiple ColorSliders
 * (hue + saturation + lightness) or use a 2D color area.
 *
 * @example
 * ```svelte
 * <div {...colorSliderAnatomy.attrs.root} role="slider"
 *      aria-valuenow={hue} aria-valuemin={0} aria-valuemax={360} aria-label="Hue">
 *   <label {...colorSliderAnatomy.attrs.label}>Hue</label>
 *   <div {...colorSliderAnatomy.attrs.track}>
 *     <span {...colorSliderAnatomy.attrs.thumb} />
 *   </div>
 * </div>
 * ```
 */
export interface ColorSliderPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the color slider */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current channel value */
	value?: number;
	/** Callback when value changes */
	onChange?: (value: number) => void;
	/** Minimum value. Default: 0 */
	min?: number;
	/** Maximum value. Default varies by channel (360 for hue, 100 for saturation/lightness) */
	max?: number;
	/** Step increment. Default: 1 */
	step?: number;
	/** Slider orientation. Default: "horizontal" */
	orientation?: ColorSliderOrientation;
	/** Disabled state */
	disabled?: boolean;
}
