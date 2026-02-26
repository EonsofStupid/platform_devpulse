/**
 * @file builders/button/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Button builder.
 * role="button" (native when <button>).
 * aria-disabled, aria-pressed (toggle mode), aria-expanded (menu trigger).
 * Keyboard: Space, Enter.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { MaybeGetter } from "../_internal/types.js";

/** HTML button type attribute. */
export type ButtonType = "button" | "submit" | "reset";

/** Constructor config for Button. MaybeGetter for controlled/uncontrolled. */
export type ButtonProps = {
	/** Whether the button is disabled. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/**
	 * Whether the button is in a pressed/toggle state.
	 * undefined = not a toggle button. true/false = toggle button with state.
	 * @default undefined
	 */
	pressed?: MaybeGetter<boolean | undefined>;
	/** Called when pressed state changes (toggle mode). */
	onPressedChange?: (pressed: boolean) => void;
	/** Whether the button is in a loading state. @default false */
	loading?: MaybeGetter<boolean | undefined>;
	/**
	 * Whether the button controls an expanded region.
	 * undefined = not a menu trigger. true/false = expanded state.
	 * @default undefined
	 */
	expanded?: MaybeGetter<boolean | undefined>;
	/** HTML button type. @default "button" */
	type?: MaybeGetter<ButtonType | undefined>;
};
