/**
 * @file builders/sheet/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Sheet builder.
 * Slide-in panel overlay with focus trap, Escape dismiss, outside click.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Side the sheet slides in from. */
export type SheetSide = "left" | "right" | "top" | "bottom";

/** Constructor config for Sheet. MaybeGetter for controlled/uncontrolled. */
export type SheetProps = {
	/** Whether the sheet is open. Getter = controlled, static = uncontrolled. @default false */
	open?: MaybeGetter<boolean | undefined>;
	/** Called when open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Accessible label for the sheet dialog. */
	label?: MaybeGetter<string | undefined>;
	/** Side to slide in from. @default "right" */
	side?: MaybeGetter<SheetSide | undefined>;
	/** Close on Escape key. @default true */
	closeOnEscape?: MaybeGetter<boolean | undefined>;
	/** Close on outside click (overlay). @default true */
	closeOnOutsideClick?: MaybeGetter<boolean | undefined>;
};
