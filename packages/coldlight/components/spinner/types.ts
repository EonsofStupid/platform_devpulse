/**
 * @file Spinner Types
 * @kind spinner
 * @layer components
 */

import type { SpinnerPrimitiveProps } from "#coldlight/behaviors/display/spinner/index.js";

/**
 * Spinner size preset. Maps to a tailwind `size-*` utility internally.
 *
 * - `xs`  = 0.75rem (12px-equivalent) — inline chips, table cells
 * - `sm`  = 1rem    (16px)            — button labels, form fields
 * - `md`  = 1.5rem  (24px)            — page-level inline waits
 * - `lg`  = 2rem    (32px)            — centered card spinners
 * - `xl`  = 2.5rem  (40px)            — full-screen overlay spinners
 */
export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Semantic color tint. Resolved at render time by the ColdLight glue
 * layer through a CSS custom property (`--spinner-tone`). Never reach
 * for raw hex / oklch / inline `style="color: ..."` — pick a tone.
 *
 * - `default` → `var(--text-primary)`     — the neutral inline fallback
 * - `muted`   → `var(--text-muted)`       — de-emphasized ambient spinner
 * - `accent`  → `var(--accent-teal-main)` — primary action, the teal halo
 * - `success` → `var(--signal-success)`   — completed / ready lane
 * - `warning` → `var(--signal-warning)`   — attention-required lane
 * - `error`   → `var(--signal-error)`     — failure / retry lane
 */
export type SpinnerTone = "default" | "muted" | "accent" | "success" | "warning" | "error";

export type SpinnerPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SpinnerProps extends SpinnerPrimitiveProps {
	/** Whether the spinner is currently spinning. Default: `true`. */
	active?: boolean;
	/** Size preset. Default: `"md"`. */
	size?: SpinnerSize;
	/** Style preset. Default: `"default"`. */
	preset?: SpinnerPreset;
	/**
	 * Semantic color tint. Default: `"default"`.
	 *
	 * Prefer this over any raw color on a spinner consumer. If you
	 * find yourself reaching for a `style="color: ..."` override,
	 * the fence in `scripts/hooks/no-raw-values.mjs` will block it —
	 * add the color as a new tone here instead.
	 */
	tone?: SpinnerTone;
	/**
	 * Optional adjacent label text. Renders inline for `xs`/`sm`/`md`
	 * sizes (spinner-left, label-right, small gap), and below the
	 * spinner for `lg`/`xl` sizes (centered stack).
	 *
	 * Use this instead of manually wrapping a Spinner in a `hstack`
	 * with a Text sibling — the Spinner primitive owns the layout.
	 */
	label?: string;
}
