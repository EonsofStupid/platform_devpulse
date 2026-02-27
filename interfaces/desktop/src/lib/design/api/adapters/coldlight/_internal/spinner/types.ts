/**
 * @file builders/spinner/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Spinner builder.
 * Contract: `role="status"`, `aria-label` (defaults to "Loading").
 * `aria-hidden` when not active.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Constructor config for Spinner builder. */
export type SpinnerProps = {
	/**
	 * Whether the spinner is active/spinning.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default true
	 */
	active?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the active state changes.
	 */
	onActiveChange?: (active: boolean) => void;

	/**
	 * Accessible label for screen readers.
	 * Applied as `aria-label` when the spinner is active.
	 *
	 * @default "Loading"
	 */
	"aria-label"?: MaybeGetter<string | undefined>;
};
