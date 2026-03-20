/**
 * center — Centering container with DTCG token-backed sizing.
 *
 * Returns a Tailwind class string. No inline styles.
 * Uses SD5 --size-* and --space-* custom properties via arbitrary value syntax.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { CenterProps } from "./center.types.js";

export function center(props: CenterProps = {}): string {
	return cn(
		"mx-auto",
		props.maxWidth !== undefined && `max-w-[var(--size-${props.maxWidth})]`,
		props.gutters !== undefined && `px-[var(--space-${props.gutters})]`,
		props.padding !== undefined && `p-[var(--space-${props.padding})]`,
	);
}
