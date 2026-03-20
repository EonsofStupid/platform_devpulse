/**
 * flex — Token-backed flex container utility.
 *
 * Returns a Tailwind class string. All spacing via token custom properties.
 * Pattern matches recipe classes() functions — cn() composition, zero inline styles.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { FlexProps } from "./flex.types.js";

const DIRECTION: Record<string, string> = {
	row: "flex-row",
	column: "flex-col",
	"row-reverse": "flex-row-reverse",
	"column-reverse": "flex-col-reverse",
};

const ALIGN: Record<string, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};

const JUSTIFY: Record<string, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
};

/**
 * Returns a Tailwind class string for flex layout.
 *
 * @example
 * flex({ direction: "column", gap: "4", padding: "8" })
 * // → "flex flex-col gap-[var(--space-4)] p-[var(--space-8)]"
 */
export function flex(props: FlexProps = {}): string {
	const dir = props.direction ?? "row";
	const wrapClass =
		props.wrap === "reverse"
			? "flex-wrap-reverse"
			: props.wrap === true
				? "flex-wrap"
				: undefined;

	return cn(
		"flex",
		DIRECTION[dir],
		props.gap !== undefined && `gap-[var(--space-${props.gap})]`,
		props.align && ALIGN[props.align],
		props.justify && JUSTIFY[props.justify],
		wrapClass,
		props.padding !== undefined && `p-[var(--space-${props.padding})]`,
	);
}
