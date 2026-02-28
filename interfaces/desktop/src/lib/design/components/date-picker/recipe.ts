/**
 * @file DatePicker Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: date-picker-trigger, date-picker-content
 */

import { cn } from "$lib/design/utils/cn.js";

type DatePickerRecipeProps = { size?: string };

export function datePickerRecipe(props: DatePickerRecipeProps = {}) {
	return {
		root: "",
		trigger: cn(
			"date-picker-trigger",
			"v-void s-glass e-0 sz-md",
			"rounded-md",
		),
		content: cn(
			"date-picker-content",
			"v-void s-glass e-3",
			"rounded-lg",
		),
		calendar: "",
		field: "",
	};
}
