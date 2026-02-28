/**
 * @file Sheet Recipe — Shortcode Composition
 * @kind sheet
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (sheet-*) handle layout/positioning.
 * Content receives v-* s-* e-* for glass surface treatment.
 * Side is controlled by sheet-{side} intent classes.
 * Size uses sheet-size-{size}-{axis} intent classes.
 * Overlay reuses dialog-overlay structural class.
 */

import { cn } from "$lib/design/utils/cn.js";

type SheetRecipeProps = { size?: string; side?: string };

const SIDE_CLASS: Record<string, string> = {
	top: "sheet-top",
	bottom: "sheet-bottom",
	left: "sheet-left",
	right: "sheet-right",
};

function sheetSizeClass(size: string, side: string): string {
	const isHorizontal = side === "top" || side === "bottom";
	const axis = isHorizontal ? "h" : "v";
	const s = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
	return `sheet-size-${s}-${axis}`;
}

export function sheetRecipe(props: SheetRecipeProps = {}): string {
	const side = props.side ?? "right";
	const size = props.size ?? "md";
	return cn(
		"sheet-content",
		"v-void s-glass e-3",
		SIDE_CLASS[side] ?? SIDE_CLASS.right,
		sheetSizeClass(size, side),
	);
}

export function sheetOverlayRecipe(): string {
	return "dialog-overlay";
}
