/**
 * @file builders/context-menu/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ContextMenu builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { MaybeGetter } from "../../builders/types.js";

export type ContextMenuProps = {
	/**
	 * Whether the context menu is currently open.
	 *
	 * Pass a getter for controlled mode (`() => boolean`), or a static
	 * value for uncontrolled mode.
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the open state changes.
	 *
	 * Receives the new open value. Use this to update your controlled
	 * state variable.
	 */
	onOpenChange?: (open: boolean) => void;

	/**
	 * Accessible label for the context menu.
	 *
	 * Applied as `aria-label` on the content element.
	 */
	"aria-label"?: string;
};
