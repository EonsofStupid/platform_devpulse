/**
 * @file Avatar Recipe — Shortcode Class Composition
 * @kind display
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (avatar-*) handle layout/positioning/sizing
 *   - Shortcode classes (v-*, s-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
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
		"v-s1",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

export function avatarImageRecipe(): string {
	return "avatar-image";
}

export function avatarFallbackRecipe(): string {
	return "avatar-fallback";
}
