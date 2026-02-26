/**
 * @file builders/input-group/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the InputGroup builder.
 *
 * Container grouping for an input element with optional prefix and suffix
 * addon slots. Uses `role="group"` to associate the input with its addons.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/**
 * Constructor configuration for the InputGroup builder.
 *
 * Uses `MaybeGetter<T>` for reactive (controlled) or static (uncontrolled) values.
 */
export type InputGroupProps = {
	/**
	 * Disable the entire input group.
	 *
	 * When `true`, `data-disabled` is applied to the root and input slots.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Accessible label for the group.
	 *
	 * Maps to `aria-label` on the root `role="group"` element.
	 * Use when no visible label element is available.
	 *
	 * @default undefined
	 */
	"aria-label"?: string;

	/**
	 * ID of the labelling element.
	 *
	 * Maps to `aria-labelledby` on the root `role="group"` element.
	 * Alternative to `aria-label` when a visible label exists.
	 *
	 * @default undefined
	 */
	"aria-labelledby"?: string;
};
