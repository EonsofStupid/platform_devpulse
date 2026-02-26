/**
 * @file Sheet Recipe
 * @kind sheet
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { SheetSize, SheetSide } from "./types.js";

const contentBase = [
	"fixed z-50",
	"bg-surface-primary border-border-subtle",
	"shadow-lg",
	"transition-transform duration-300 ease-in-out",
	"flex flex-col",
	"overflow-y-auto",
].join(" ");

const overlayBase = [
	"fixed inset-0 z-40",
	"bg-black/50",
	"transition-opacity duration-300",
].join(" ");

const sideStyles: Record<SheetSide, string> = {
	right: "inset-y-0 right-0 border-l",
	left: "inset-y-0 left-0 border-r",
	top: "inset-x-0 top-0 border-b",
	bottom: "inset-x-0 bottom-0 border-t",
};

const sizeStylesHorizontal: Record<SheetSize, string> = {
	sm: "w-72",
	md: "w-96",
	lg: "w-[32rem]",
	xl: "w-[40rem]",
	full: "w-screen",
};

const sizeStylesVertical: Record<SheetSize, string> = {
	sm: "h-48",
	md: "h-64",
	lg: "h-96",
	xl: "h-[32rem]",
	full: "h-screen",
};

export function sheetRecipe(opts: {
	size: SheetSize;
	side: SheetSide;
}): string {
	const isVertical = opts.side === "top" || opts.side === "bottom";
	const sizeClass = isVertical
		? sizeStylesVertical[opts.size]
		: sizeStylesHorizontal[opts.size];
	return `${contentBase} ${sideStyles[opts.side]} ${sizeClass}`;
}

export function sheetOverlayRecipe(): string {
	return overlayBase;
}
