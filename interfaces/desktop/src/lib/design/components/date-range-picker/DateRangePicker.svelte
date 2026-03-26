<!--
	@component Date Range Picker
	@kind date-range-picker
	@layer component
	@category interactive
	@description Date range field with an attached dual-calendar popover for visual range selection
	@container false
	@compound true
	@blockCategory form
	@defaultStyle date-range-picker-default
	@styleIds date-range-picker-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, typography, color
	@slots root:all, field:none, trigger:none, calendar:none, label:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setDateRangePickerContext } from "./context.js";
import type { DateRangePickerRootProps, DateRangeValue } from "./types.js";

let {
	ids: userIds,
	value: controlledValue,
	defaultValue = null,
	onChange,
	isOpen: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	shouldCloseOnSelect = true,
	allowsNonContiguousRanges = false,
	inline = false,
	granularity = "day",
	maxVisibleMonths = 1,
	isDateUnavailable,
	minValue, maxValue, firstDayOfWeek,
	isDisabled = false, isReadOnly = false, isRequired = false,
	isInvalid: controlledInvalid = false,
	validate,
	size = "md", locale = "en-US",
	label, description, errorMessage,
	startName, endName, form,
	dir = "ltr",
	intent = "default",
	children, class: className, ...rest
}: DateRangePickerRootProps = $props();

const autoIds = createIds("date-range-picker", ["root", "startField", "endField", "trigger", "content", "label", "description", "errorMessage"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	startField: userIds?.startField ?? autoIds.startField,
	endField: userIds?.endField ?? autoIds.endField,
	trigger: userIds?.trigger ?? autoIds.trigger,
	content: userIds?.content ?? autoIds.content,
	label: userIds?.label ?? autoIds.label,
	description: userIds?.description ?? autoIds.description,
	errorMessage: userIds?.errorMessage ?? autoIds.errorMessage,
});

let internalValue = $state<DateRangeValue | null>(defaultValue);
$effect(() => { if (controlledValue !== undefined) internalValue = controlledValue; });
const currentValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

let internalOpen = $state(defaultOpen);
$effect(() => { if (controlledOpen !== undefined) internalOpen = controlledOpen; });
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

const validationError = $derived(() => {
	if (!validate || !currentValue) return null;
	return validate(currentValue) ?? null;
});
const isInvalid = $derived(controlledInvalid || validationError() !== null);

function toggle() { if (isDisabled || inline) return; const next = !isOpen; internalOpen = next; onOpenChange?.({ open: next }); }
function openPopover() { if (isDisabled || isOpen || inline) return; internalOpen = true; onOpenChange?.({ open: true }); }
function closePopover() { if (!isOpen) return; internalOpen = false; onOpenChange?.({ open: false }); }

function selectRange(range: DateRangeValue) {
	if (isDisabled || isReadOnly) return;
	internalValue = range;
	onChange?.({ value: range });
	if (shouldCloseOnSelect && range.start && range.end) closePopover();
}

function updateStart(date: Date | null) {
	if (isDisabled || isReadOnly) return;
	const range: DateRangeValue = { start: date, end: currentValue?.end ?? null };
	internalValue = range;
	onChange?.({ value: range });
}

function updateEnd(date: Date | null) {
	if (isDisabled || isReadOnly) return;
	const range: DateRangeValue = { start: currentValue?.start ?? null, end: date };
	internalValue = range;
	onChange?.({ value: range });
}

setDateRangePickerContext({
	get value() { return currentValue; },
	get isOpen() { return isOpen; },
	get isDisabled() { return isDisabled; },
	get isReadOnly() { return isReadOnly; },
	get isRequired() { return isRequired; },
	get isInvalid() { return isInvalid; },
	get inline() { return inline; },
	get locale() { return locale; },
	get size() { return size; },
	get dir() { return dir; },
	get ids() { return resolvedIds; },
	get shouldCloseOnSelect() { return shouldCloseOnSelect; },
	toggle, openPopover, closePopover, selectRange, updateStart, updateEnd,
});

</script>

<StyleMacro kind="date-range-picker" intent={intent}>
<div
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-labelledby={label ? resolvedIds.label : undefined}
	aria-describedby={description ? resolvedIds.description : undefined}
	aria-disabled={isDisabled || undefined}
	data-kind="date-range-picker"
	data-slot="root"
	data-state={isDisabled ? "disabled" : isInvalid ? "invalid" : undefined}
	data-inline={inline || undefined}
	class={cn(className)}
	{...rest}
>
	{#if label}
		<label id={resolvedIds.label} class="text-sm font-medium" data-kind="date-range-picker" data-slot="label">
			{label}{#if isRequired}<span aria-hidden="true" class="text-[var(--color-red-400)] ms-2">*</span>{/if}
		</label>
	{/if}

	{@render children?.()}

	{#if description}
		<p id={resolvedIds.description} class="text-xs" data-kind="date-range-picker" data-slot="description">{description}</p>
	{/if}

	{#if isInvalid && (errorMessage || validationError())}
		<p id={resolvedIds.errorMessage} role="alert" class="text-xs text-red-500" data-kind="date-range-picker" data-slot="error-message">
			{errorMessage ?? validationError()}
		</p>
	{/if}

	{#if startName}
		<input type="hidden" name={startName} value={currentValue?.start?.toISOString() ?? ""} {form} />
	{/if}
	{#if endName}
		<input type="hidden" name={endName} value={currentValue?.end?.toISOString() ?? ""} {form} />
	{/if}
</div>
</StyleMacro>
