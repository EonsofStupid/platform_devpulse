/**
 * @file DateRangeField Composition — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DateRangeFieldRecipeProps = { size?: string };

export function dateRangeFieldComposition(_props: DateRangeFieldRecipeProps = {}) {
	return {
		root: cn("date-range-field-root", "rounded-md"),
		field: cn("date-range-field-field"),
		start: "",
		end: "",
		segment: cn("date-range-field-segment"),
		literal: cn("date-range-field-literal"),
		separator: cn("date-range-field-separator"),
	};
}
