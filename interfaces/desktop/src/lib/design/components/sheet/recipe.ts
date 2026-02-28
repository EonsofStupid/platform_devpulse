/**
 * @file Sheet Recipe
 * @kind sheet
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type SheetRecipeProps = { size?: string; side?: string };

export function sheetRecipe(props: SheetRecipeProps = {}): string {
	const sideMap: Record<string, string> = {
		top: "inset-x-0 top-0",
		bottom: "inset-x-0 bottom-0",
		left: "inset-y-0 left-0",
		right: "inset-y-0 right-0",
	};
	const sizeMap: Record<string, string> = {
		sm: props.side === "top" || props.side === "bottom" ? "h-1/3" : "w-72",
		md: props.side === "top" || props.side === "bottom" ? "h-1/2" : "w-96",
		lg: props.side === "top" || props.side === "bottom" ? "h-2/3" : "w-[480px]",
	};
	return cn(
		"fixed z-50 p-6",
		"v-void s-glass e-3",
		sideMap[props.side ?? "right"] ?? sideMap.right,
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

export function sheetOverlayRecipe(): string {
	return "dialog-overlay";
}
