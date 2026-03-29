import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Supported color format for input/output */
export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch";

/**
 * Structural props for the ColorField primitive.
 *
 * A color field accepts color values as text input with a swatch preview.
 * Validates the input against the specified format. For visual color picking
 * (sliders, gradients), use ColorSlider or a color picker composition instead.
 *
 * @example
 * ```svelte
 * <div {...colorFieldAnatomy.attrs.root}>
 *   <label {...colorFieldAnatomy.attrs.label} for={inputId}>Background</label>
 *   <input {...colorFieldAnatomy.attrs.input} id={inputId} value={color} />
 *   <span {...colorFieldAnatomy.attrs.swatch} aria-hidden="true" style:background={color} />
 * </div>
 * ```
 */
export interface ColorFieldPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the color field */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current color value string */
	value?: string;
	/** Callback when color value changes */
	onChange?: (value: string) => void;
	/** Expected color format for validation. Default: "hex" */
	format?: ColorFormat;
	/** Disabled state — prevents interaction */
	disabled?: boolean;
	/** Whether the field is required */
	required?: boolean;
	/** Whether the current value is invalid */
	invalid?: boolean;
}
