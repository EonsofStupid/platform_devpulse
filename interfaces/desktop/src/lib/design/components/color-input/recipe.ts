/**
 * @file ColorInput Recipe
 * @kind interactive
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: color-input-root, color-input-swatch, color-input-hidden, color-input-label
 * Size intent classes: color-input-swatch-{size}, color-input-label-{size}
 */

import { cn } from "$lib/design/utils/cn.js";

type ColorInputRecipeProps = { size?: string };

export function colorInputRecipe(props: ColorInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"color-input-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

export function colorInputSwatchRecipe(props: ColorInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "color-input-swatch-sm",
		md: "color-input-swatch-md",
		lg: "color-input-swatch-lg",
	};
	return cn(
		"color-input-swatch",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

export function colorInputInputRecipe(): string {
	return "color-input-hidden";
}

export function colorInputLabelRecipe(props: ColorInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "color-input-label-sm",
		md: "color-input-label-md",
		lg: "color-input-label-md",
	};
	return cn(
		"color-input-label",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
