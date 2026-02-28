/**
 * @file DateRangePicker Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: date-range-picker-trigger, date-range-picker-content
 */

import { cn } from "$lib/design/utils/cn.js";

type DateRangePickerRecipeProps = { size?: string };

export function dateRangePickerRecipe(props: DateRangePickerRecipeProps = {}) {
	return {
		root: "",
		trigger: cn(
			"date-range-picker-trigger",
			"v-void s-glass e-0 sz-md",
			"rounded-md",
		),
		content: cn(
			"date-range-picker-content",
			"v-void s-glass e-3",
			"rounded-lg",
		),
		calendar: "",
		field: "",
	};
}
