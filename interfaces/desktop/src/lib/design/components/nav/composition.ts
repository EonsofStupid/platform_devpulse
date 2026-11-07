/**
 * @file Nav Composition
 * @kind nav
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by nav-root @utility + nav-horizontal / nav-vertical intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type NavRecipeProps = { size?: string; orientation?: string };

export function navComposition(props: NavRecipeProps = {}): string {
	const orientationClass = props.orientation === "vertical" ? "nav-vertical" : "nav-horizontal";
	return cn("nav-root", orientationClass);
}
