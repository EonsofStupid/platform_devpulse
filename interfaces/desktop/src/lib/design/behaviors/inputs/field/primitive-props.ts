import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Field orientation — controls label/control layout direction */
export type FieldOrientation = "vertical" | "horizontal";

/**
 * Structural props for the Field primitive.
 *
 * A field is the universal form input container. It groups label, control,
 * description, and error into a semantic unit with automatic ARIA wiring.
 *
 * Every form input in ColdLight (TextField, Select, Combobox, DatePicker, etc.)
 * composes from this primitive for consistent structure and accessibility.
 *
 * The behavior hook (useField) generates IDs and wires aria-describedby,
 * aria-labelledby, and aria-invalid automatically.
 *
 * @example
 * ```svelte
 * <div {...fieldAnatomy.attrs.root}>
 *   <label {...fieldAnatomy.attrs.label} for={controlId}>Email</label>
 *   <input {...fieldAnatomy.attrs.control} id={controlId} type="email" />
 *   <div {...fieldAnatomy.attrs.description}>We'll never share your email.</div>
 *   {#if error}
 *     <div {...fieldAnatomy.attrs.error}>{error}</div>
 *   {/if}
 * </div>
 * ```
 */
export interface FieldPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the field */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Label/control layout direction. Default: "vertical" */
	orientation?: FieldOrientation;
	/** Whether the field value is invalid */
	invalid?: boolean;
	/** Whether the field is required */
	required?: boolean;
	/** Whether the field is disabled */
	disabled?: boolean;
	/** Whether the field is read-only */
	readonly?: boolean;
	/** Error message — when present, field enters invalid state */
	error?: string;
}
