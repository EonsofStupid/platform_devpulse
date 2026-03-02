/**
 * @file DatePicker Recipe — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DatePickerRecipeProps = { size?: string };

export function datePickerRecipe(props: DatePickerRecipeProps = {}) {
	return {
		root: "",
		trigger: cn(
			"date-picker-trigger",
			"h-10 px-4 text-sm",
			"rounded-md",
		),
		content: cn(
			"date-picker-content",
			"p-4 text-sm",
			"rounded-lg",
		),
		calendar: "",
		field: "",
	};
}
