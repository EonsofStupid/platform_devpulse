<!--
	@component DateRangePicker
	@kind date-range-picker
	@layer components

	ColdLight DateRangePicker root — combines date-range-field + range-calendar in popover.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Dialog (Modal) + Grid Pattern
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { type DateRangePickerContext, setDateRangePickerContext } from "./context.js";
import { dateRangePickerRecipe } from "./recipe.js";
import type { DateRange, DateRangePickerProps } from "./types.js";

let {
	startDate = undefined,
	endDate = undefined,
	onRangeChange,
	open = false,
	onOpenChange,
	min,
	max,
	disabled = false,
	locale = "en-US",
	size = "md",
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	// Rest spread
	...rest
}: DateRangePickerProps = $props();

const uid = Math.random().toString(36).slice(2, 9);
const triggerId = `drp-trigger-${uid}`;
const contentId = `drp-content-${uid}`;

let isOpen = $state(false);

$effect(() => {
	isOpen = open;
});

const ctx: DateRangePickerContext = {
	get startDate() {
		return startDate;
	},
	get endDate() {
		return endDate;
	},
	get open() {
		return isOpen;
	},
	get disabled() {
		return disabled;
	},
	get locale() {
		return locale;
	},
	get size() {
		return size;
	},
	get min() {
		return min;
	},
	get max() {
		return max;
	},
	triggerId,
	contentId,
	toggle() {
		if (disabled) return;
		isOpen = !isOpen;
		onOpenChange?.(isOpen);
	},
	openPopover() {
		if (disabled || isOpen) return;
		isOpen = true;
		onOpenChange?.(true);
	},
	closePopover() {
		if (!isOpen) return;
		isOpen = false;
		onOpenChange?.(false);
	},
	selectRange(range: DateRange) {
		if (disabled) return;
		onRangeChange?.(range);
		// Close only when both start and end are set
		if (range.start && range.end) {
			ctx.closePopover();
		}
	},
	updateRange(range: DateRange) {
		if (disabled) return;
		onRangeChange?.(range);
	},
};

setDateRangePickerContext(ctx);

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

const recipe = $derived(dateRangePickerRecipe({ size }));
</script>

<div
	role="group"
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="date-range-picker"
	data-slot="root"
	data-state={disabled ? "disabled" : undefined}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
