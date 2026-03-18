<!--
	@component DatePicker
	@kind date-picker
	@layer components

	ColdLight DatePicker root — combines date-field + calendar in popover.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Dialog (Modal) + Grid Pattern
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import { type DatePickerContext, setDatePickerContext } from "./context.js";
import { datePickerRecipe } from "./recipe.js";
import type { DatePickerProps } from "./types.js";

let {
	value = undefined,
	onValueChange,
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
}: DatePickerProps = $props();

const uid = Math.random().toString(36).slice(2, 9);
const triggerId = `dp-trigger-${uid}`;
const contentId = `dp-content-${uid}`;

let isOpen = $state(false);

$effect(() => {
	isOpen = open;
});

const ctx: DatePickerContext = {
	get value() {
		return value;
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
	selectDate(date: Date) {
		if (disabled) return;
		onValueChange?.(date);
		ctx.closePopover();
	},
	updateValue(date: Date | undefined) {
		if (disabled) return;
		onValueChange?.(date);
	},
};

setDatePickerContext(ctx);

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

const recipe = $derived(datePickerRecipe({ size }));
</script>

<div
	role="group"
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="date-picker"
	data-slot="root"
	data-state={disabled ? "disabled" : undefined}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
