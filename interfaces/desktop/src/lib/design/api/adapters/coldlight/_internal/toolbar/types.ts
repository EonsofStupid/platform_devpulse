/**
 * @file builders/toolbar/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Toolbar builder.
 *
 * The Toolbar provides a container with arrow-key navigation between
 * toolbar items, following the WAI-ARIA Toolbar pattern.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { MaybeGetter, Orientation } from "../../builders/types.js";

/**
 * Constructor configuration for the Toolbar builder.
 *
 * Uses `MaybeGetter<T>` for reactive (controlled) or static (uncontrolled) values.
 */
export type ToolbarProps = {
	/**
	 * Accessible label for the toolbar.
	 *
	 * Maps to `aria-label` on the root element. Required for accessibility
	 * when the toolbar purpose is not obvious from context.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Orientation for arrow key navigation.
	 *
	 * - `"horizontal"` — ArrowLeft/ArrowRight navigate
	 * - `"vertical"` — ArrowUp/ArrowDown navigate
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<Orientation | undefined>;

	/**
	 * Disable the entire toolbar.
	 *
	 * When `true`, all items become non-interactive and receive `aria-disabled`.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether arrow key navigation wraps around at boundaries.
	 *
	 * When `true`, pressing the next arrow key on the last item focuses the first item,
	 * and vice versa.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;
};
