/**
 * useVisuallyHidden — Screen-reader-only utility.
 *
 * Returns Tailwind class string. No inline styles.
 * Uses Tailwind v4 sr-only / not-sr-only utilities.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { UseVisuallyHiddenProps, UseVisuallyHiddenReturn } from "./visually-hidden.types.js";

export function useVisuallyHidden(props: UseVisuallyHiddenProps = {}): UseVisuallyHiddenReturn {
	return {
		get className() {
			return cn("sr-only", props.isFocusable && "focus:not-sr-only");
		},
	};
}
