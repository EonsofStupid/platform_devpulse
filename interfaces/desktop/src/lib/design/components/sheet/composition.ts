/**
 * @file Sheet Composition — Structural Classes Only
 * @kind sheet
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
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

export function sheetComposition(props: SheetRecipeProps = {}): string {
	const side = props.side ?? "right";
	const size = props.size ?? "md";
	return cn("sheet-content", SIDE_CLASS[side] ?? SIDE_CLASS.right, sheetSizeClass(size, side));
}

export function sheetOverlayComposition(): string {
	return "dialog-overlay";
}
