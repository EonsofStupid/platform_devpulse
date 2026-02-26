/**
 * @file builders/banner/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Banner builder.
 *
 * Contract: `role="alert"` with optional `aria-live` override.
 * Dismissible via Synced<boolean> for visible state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for the {@link Banner} builder. */
export type BannerProps = {
	/**
	 * Whether the banner is visible.
	 *
	 * Pass a getter for controlled (reactive) mode or a static value
	 * for uncontrolled mode.
	 *
	 * @default true
	 */
	visible?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the visible state changes (e.g. on dismiss).
	 *
	 * Fires on programmatic `dismiss()` / `show()` calls and
	 * when the action slot's click handler triggers.
	 */
	onVisibleChange?: (visible: boolean) => void;

	/**
	 * Accessible label for the banner region.
	 *
	 * Applied as `aria-label` on the root element.
	 *
	 * @default undefined
	 */
	"aria-label"?: MaybeGetter<string | undefined>;

	/**
	 * Live region politeness override.
	 *
	 * `role="alert"` implies assertive by default.
	 * Set explicitly to override the implicit behaviour.
	 *
	 * @default undefined
	 */
	"aria-live"?: MaybeGetter<"polite" | "assertive" | "off" | undefined>;
};
