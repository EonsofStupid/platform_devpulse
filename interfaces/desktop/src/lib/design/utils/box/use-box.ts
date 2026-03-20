/**
 * box — Generic box container with token-backed padding and max-width.
 *
 * Returns a Tailwind class string. All spacing via token custom properties.
 * Pattern matches recipe classes() functions — cn() composition, zero inline styles.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { BoxProps } from "./box.types.js";

/**
 * Returns a Tailwind class string for a box container.
 *
 * @example
 * box({ padding: "8", maxWidth: "container-md" })
 * // → "p-8 max-w-[var(--size-container-md)]"
 *
 * box({ paddingX: "6", paddingY: "4" })
 * // → "px-6 py-4"
 */
export function box(props: BoxProps = {}): string {
	return cn(
		props.padding !== undefined && `p-${props.padding}`,
		props.paddingX !== undefined && `px-${props.paddingX}`,
		props.paddingY !== undefined && `py-${props.paddingY}`,
		props.maxWidth !== undefined && `max-w-[var(--size-${props.maxWidth})]`,
	);
}
