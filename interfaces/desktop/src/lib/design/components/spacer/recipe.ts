/**
 * @file Spacer Recipe — Shortcode Composition
 * @kind spacer
 * @layer components
 *
 * GOLD STANDARD — structural classes only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Purely structural component. Size is controlled via
 * spacer-{size} intent classes that set fixed heights.
 */

import { cn } from "$lib/design/utils/cn.js";

type SpacerRecipeProps = { size?: string };

const SIZE_CLASS: Record<string, string> = {
	xs: "spacer-xs",
	sm: "spacer-sm",
	md: "spacer-md",
	lg: "spacer-lg",
	xl: "spacer-xl",
	auto: "spacer-auto",
};

export function spacerRecipe(props: SpacerRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"spacer-root",
		SIZE_CLASS[size] ?? SIZE_CLASS.md,
	);
}
