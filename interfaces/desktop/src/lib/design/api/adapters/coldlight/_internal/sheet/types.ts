/**
 * @file builders/sheet/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Sheet builder.
 * Slide-in panel overlay with focus trap, Escape dismiss, outside click.
 */

import type { MaybeGetter } from "../../builders/types.js";

/**
 * Side the sheet slides in from.
 *
 * Determines the `data-side` attribute on the content panel for
 * CSS transition direction.
 */
export type SheetSide = "left" | "right" | "top" | "bottom";

/**
 * Constructor config for Sheet.
 *
 * All props support the `MaybeGetter<T>` pattern for controlled/uncontrolled usage.
 */
export type SheetProps = {
	/**
	 * Whether the sheet is open.
	 *
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the open state changes.
	 *
	 * Receives the new open boolean value.
	 */
	onOpenChange?: (open: boolean) => void;

	/**
	 * Accessible label for the sheet dialog.
	 *
	 * Applied as `aria-label` on the content panel with `role="dialog"`.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Side to slide in from — "left", "right", "top", or "bottom".
	 *
	 * Controls the `data-side` attribute on the content panel.
	 *
	 * @default "right"
	 */
	side?: MaybeGetter<SheetSide | undefined>;

	/**
	 * Whether pressing Escape closes the sheet.
	 *
	 * When true, the content panel's `onkeydown` handler intercepts
	 * the Escape key and closes the sheet.
	 *
	 * @default true
	 */
	closeOnEscape?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether clicking the overlay backdrop closes the sheet.
	 *
	 * When true, the overlay's `onclick` handler closes the sheet.
	 *
	 * @default true
	 */
	closeOnOutsideClick?: MaybeGetter<boolean | undefined>;
};
