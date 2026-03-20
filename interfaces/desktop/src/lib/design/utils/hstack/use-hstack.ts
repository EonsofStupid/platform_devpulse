/**
 * hstack — Horizontal stack layout utility.
 *
 * Returns a Tailwind class string. All spacing via token custom properties.
 * Pattern matches recipe classes() functions — cn() composition, zero inline styles.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { HStackProps } from "./hstack.types.js";
import type { SpaceToken } from "$lib/design/types/spacing.js";

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
 * Returns a Tailwind class string for horizontal flex layout.
 *
 * @example
 * hstack({ gap: "8", align: "center" })
 * // → "flex flex-row gap-8 items-center"
 */
export function hstack(props: HStackProps = {}): string {
	return cn(
		"flex",
		props.reverse ? "flex-row-reverse" : "flex-row",
		props.gap !== undefined && `gap-${props.gap}`,
		props.align && ALIGN[props.align],
		props.justify && JUSTIFY[props.justify],
		props.wrap && "flex-wrap",
	);
}
