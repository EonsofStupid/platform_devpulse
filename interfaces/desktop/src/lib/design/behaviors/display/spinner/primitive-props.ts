import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Spinner size presets.
 *
 * Five steps covering the real use range in the product:
 *
 * - `xs` — inline chips, status pills, table cells
 * - `sm` — button labels, form fields, inline "X is happening" rows
 * - `md` — page-level inline waits (the default)
 * - `lg` — centered card spinners
 * - `xl` — full-screen overlay spinners
 *
 * Kept in lockstep with `SpinnerSize` in
 * `$lib/design/components/spinner/types.ts` — the component layer
 * re-exports from here so there's one SSOT.
 */
export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Structural props for the Spinner primitive.
 *
 * A spinner indicates loading state. For progress with a known percentage,
 * use Progress. For skeleton placeholders that show content shape, use Skeleton.
 *
 * @example
 * ```svelte
 * <div {...spinnerAnatomy.attrs.root} role="status" aria-live="polite" aria-label="Loading">
 *   <span {...spinnerAnatomy.attrs.indicator} aria-hidden="true" />
 *   <span {...spinnerAnatomy.attrs.label}>Loading...</span>
 * </div>
 * ```
 */
export interface SpinnerPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the spinner */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Spinner size. Default: "md" */
	size?: SpinnerSize;
	/** Accessible label for the loading state. Default: "Loading" */
	label?: string;
}
