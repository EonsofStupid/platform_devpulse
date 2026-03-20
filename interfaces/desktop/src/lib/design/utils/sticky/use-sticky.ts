/**
 * useSticky — Sticky positioning utility.
 *
 * Returns Tailwind class string. No inline styles.
 * Token-backed top offset and z-index via DTCG types.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { UseStickyProps, UseStickyReturn } from "./sticky.types.js";

export function useSticky(props: UseStickyProps = {}): UseStickyReturn {
	const offset = props.offset ?? "0";
	const zIndex = props.zIndex ?? "sticky";

	const topClass = `top-${offset}`;
	const zClass = `z-[var(--z-index-${zIndex})]`;

	return {
		get className() {
			return cn("sticky", topClass, zClass);
		},
	};
}
