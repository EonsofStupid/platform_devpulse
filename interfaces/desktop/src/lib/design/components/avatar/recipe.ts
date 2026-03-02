/**
 * @file Avatar Recipe — Structural Classes Only
 * @kind display
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type AvatarRecipeProps = { size?: string };

export function avatarRootRecipe(props: AvatarRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "avatar-sm",
		md: "avatar-md",
		lg: "avatar-lg",
	};
	return cn(
		"avatar-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

export function avatarImageRecipe(): string {
	return "avatar-image";
}

export function avatarFallbackRecipe(): string {
	return "avatar-fallback";
}
