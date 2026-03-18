/**
 * @file Container Recipe
 * @kind layout
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural class: container-root
 * Size intent classes: container-{size}
 */

import { cn } from "$lib/design/utils/cn.js";

type ContainerRecipeProps = { size?: string };

export function containerRecipe(props: ContainerRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "container-sm",
		md: "container-md",
		lg: "container-lg",
		xl: "container-xl",
		full: "container-full",
	};
	return cn("container-root", sizeMap[props.size ?? "lg"] ?? sizeMap.lg);
}
