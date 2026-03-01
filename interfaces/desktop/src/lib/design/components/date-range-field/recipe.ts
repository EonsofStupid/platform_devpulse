/**
 * @file DateRangeField Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: date-range-field-root, date-range-field-field,
 *   date-range-field-segment, date-range-field-literal, date-range-field-separator
 */

import { cn } from "$lib/design/utils/cn.js";

type DateRangeFieldRecipeProps = { size?: string };

export function dateRangeFieldRecipe(props: DateRangeFieldRecipeProps = {}) {
	return {
		root: cn(
			"date-range-field-root",
			"v-s1",
			"rounded-md",
		),
		field: cn("date-range-field-field"),
		start: "",
		end: "",
		segment: cn("date-range-field-segment"),
		literal: cn("date-range-field-literal"),
		separator: cn("date-range-field-separator"),
	};
}
