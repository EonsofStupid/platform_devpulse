/**
 * @file Steps Composition
 * @kind steps
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by steps-root @utility + steps-horizontal / steps-vertical intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type StepsRecipeProps = { size?: string; orientation?: string };

export function stepsComposition(props: StepsRecipeProps = {}): string {
	const orientationClass = props.orientation === "vertical" ? "steps-vertical" : "steps-horizontal";
	return cn("steps-root", orientationClass);
}
