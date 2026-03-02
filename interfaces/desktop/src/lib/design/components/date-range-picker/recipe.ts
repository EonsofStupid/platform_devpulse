/**
 * @file DateRangePicker Recipe — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DateRangePickerRecipeProps = { size?: string };

export function dateRangePickerRecipe(props: DateRangePickerRecipeProps = {}) {
	return {
		root: "",
		trigger: cn(
			"date-range-picker-trigger",
			"h-10 px-4 text-sm",
			"rounded-md",
		),
		content: cn(
			"date-range-picker-content",
			"p-4 text-sm",
			"rounded-lg",
		),
		calendar: "",
		field: "",
	};
}
