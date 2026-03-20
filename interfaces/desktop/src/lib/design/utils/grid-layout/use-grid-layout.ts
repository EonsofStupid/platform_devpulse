/**
 * gridLayout — CSS Grid container with DTCG token-backed spacing.
 *
 * Returns a Tailwind class string. No inline styles.
 * Uses Tailwind v4 --spacing-* theme utilities (no arbitrary syntax needed).
 */

import { cn } from "$lib/design/utils/cn.js";
import type { GridLayoutProps } from "./grid-layout.types.js";

const AUTO_FLOW_MAP: Record<NonNullable<GridLayoutProps["autoFlow"]>, string> = {
	row: "grid-flow-row",
	column: "grid-flow-col",
	dense: "grid-flow-dense",
	"row dense": "grid-flow-row-dense",
	"column dense": "grid-flow-col-dense",
};

const ALIGN_MAP: Record<NonNullable<GridLayoutProps["alignItems"]>, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
};

const JUSTIFY_MAP: Record<NonNullable<GridLayoutProps["justifyItems"]>, string> = {
	start: "justify-items-start",
	center: "justify-items-center",
	end: "justify-items-end",
	stretch: "justify-items-stretch",
};

function resolveColumns(columns: number | string): string {
	return typeof columns === "number"
		? `grid-cols-${columns}`
		: `grid-cols-[${columns}]`;
}

function resolveRows(rows: number | string): string {
	return typeof rows === "number"
		? `grid-rows-${rows}`
		: `grid-rows-[${rows}]`;
}

export function gridLayout(props: GridLayoutProps = {}): string {
	return cn(
		"grid",
		props.columns !== undefined && resolveColumns(props.columns),
		props.rows !== undefined && resolveRows(props.rows),
		props.gap !== undefined && `gap-${props.gap}`,
		props.columnGap !== undefined && `gap-x-${props.columnGap}`,
		props.rowGap !== undefined && `gap-y-${props.rowGap}`,
		props.padding !== undefined && `p-${props.padding}`,
		props.autoFlow !== undefined && AUTO_FLOW_MAP[props.autoFlow],
		props.alignItems !== undefined && ALIGN_MAP[props.alignItems],
		props.justifyItems !== undefined && JUSTIFY_MAP[props.justifyItems],
	);
}
