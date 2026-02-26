/**
 * @file builders/alert/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Alert builder.
 *
 * Contract: `role="alert"` (implicit `aria-live="assertive"`).
 * Optional dismiss action via `Synced<boolean>` for visible state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Semantic variant for the alert tone.
 *
 * Used by styled components to apply variant-specific colors and icons.
 * The builder itself does not consume this value directly — it is
 * forwarded to the component layer for styling.
 */
export type AlertVariant = "info" | "success" | "warning" | "error";

/**
 * Constructor configuration for the Alert builder.
 *
 * Uses `MaybeGetter<T>` for reactive (controlled) or static (uncontrolled) values.
 */
export type AlertProps = {
	/**
	 * Whether the alert is visible.
	 *
	 * Pass a getter for controlled mode, a static value for uncontrolled.
	 * When `false`, the root element receives `hidden` and `data-state="hidden"`.
	 *
	 * @default true
	 */
	visible?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the visible state changes (e.g., on dismiss or show).
	 *
	 * Receives the new visibility boolean.
	 */
	onVisibleChange?: (visible: boolean) => void;

	/**
	 * Semantic variant for the alert tone.
	 *
	 * Determines the visual style (color, icon) at the component layer.
	 * The builder does not use this value for ARIA — it is passed through.
	 *
	 * @default "info"
	 */
	variant?: MaybeGetter<AlertVariant | undefined>;

	/**
	 * Accessible label for the alert region.
	 *
	 * Maps to `aria-label` on the root element. Use when the alert
	 * content alone does not convey its purpose.
	 *
	 * @default undefined
	 */
	"aria-label"?: MaybeGetter<string | undefined>;

	/**
	 * ID of the element that labels the alert.
	 *
	 * Maps to `aria-labelledby` on the root element. Alternative to
	 * `aria-label` when a visible heading provides the label.
	 *
	 * @default undefined
	 */
	"aria-labelledby"?: MaybeGetter<string | undefined>;
};
