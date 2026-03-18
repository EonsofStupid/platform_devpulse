/**
 * @file ColorInput Recipe — Structural Classes Only
 * @kind interactive
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ColorInputRecipeProps = { size?: string };

export function colorInputRecipe(props: ColorInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "h-8 px-3 text-sm",
		md: "h-10 px-4 text-sm",
		lg: "h-12 px-6 text-base",
	};
	return cn("color-input-root", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}

export function colorInputSwatchRecipe(props: ColorInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "color-input-swatch-sm",
		md: "color-input-swatch-md",
		lg: "color-input-swatch-lg",
	};
	return cn("color-input-swatch", sizeMap[props.size ?? "md"] ?? sizeMap.md);
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
	return cn("color-input-label", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}
