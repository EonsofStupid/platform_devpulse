<!--
	@component Date Picker
	@kind date-picker
	@layer component
	@category interactive
	@description Date field with an attached calendar popover for visual date selection
	@container false
	@compound true
	@blockCategory form
	@defaultStyle date-picker-default
	@styleIds date-picker-default
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
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setDatePickerContext } from "./context.js";
import type { DatePickerRootProps } from "./types.js";

let {
	ids: userIds,
	value: controlledValue,
	defaultValue = null,
	onChange,
	isOpen: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	shouldCloseOnSelect = true,
	granularity = "day",
	maxVisibleMonths = 1,
	isDateUnavailable,
	minValue,
	maxValue,
	firstDayOfWeek,
	isDisabled = false,
	isReadOnly = false,
	isRequired = false,
	isInvalid: controlledInvalid = false,
	validate,
	size = "md",
	locale = "en-US",
	label,
	description,
	errorMessage,
	name,
	form,
	dir = "ltr",
	intent = "default",
	children,
	class: className,
	...rest
}: DatePickerRootProps = $props();

// IDs
const autoIds = createIds("date-picker", ["root", "field", "trigger", "content", "label", "description", "errorMessage"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	field: userIds?.field ?? autoIds.field,
	trigger: userIds?.trigger ?? autoIds.trigger,
	content: userIds?.content ?? autoIds.content,
	label: userIds?.label ?? autoIds.label,
	description: userIds?.description ?? autoIds.description,
	errorMessage: userIds?.errorMessage ?? autoIds.errorMessage,
});

// Value state
let internalValue = $state<Date | null>(defaultValue);
$effect(() => { if (controlledValue !== undefined) internalValue = controlledValue; });
const currentValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

// Open state
let internalOpen = $state(defaultOpen);
$effect(() => { if (controlledOpen !== undefined) internalOpen = controlledOpen; });
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

// Validation
const validationError = $derived(() => {
	if (!validate || !currentValue) return null;
	return validate(currentValue) ?? null;
});
const isInvalid = $derived(controlledInvalid || validationError() !== null);

function toggle() {
	if (isDisabled) return;
	const next = !isOpen;
	internalOpen = next;
	onOpenChange?.({ open: next });
}

function openPopover() {
	if (isDisabled || isOpen) return;
	internalOpen = true;
	onOpenChange?.({ open: true });
}

function closePopover() {
	if (!isOpen) return;
	internalOpen = false;
	onOpenChange?.({ open: false });
}

function selectDate(date: Date) {
	if (isDisabled || isReadOnly) return;
	internalValue = date;
	onChange?.({ value: date });
	if (shouldCloseOnSelect) closePopover();
}

function updateValue(date: Date | null) {
	if (isDisabled || isReadOnly) return;
	internalValue = date;
	onChange?.({ value: date });
}

// Composition

// Context
setDatePickerContext({
	get value() { return currentValue; },
	get isOpen() { return isOpen; },
	get isDisabled() { return isDisabled; },
	get isReadOnly() { return isReadOnly; },
	get isRequired() { return isRequired; },
	get isInvalid() { return isInvalid; },
	get locale() { return locale; },
	get size() { return size; },
	get dir() { return dir; },
	get ids() { return resolvedIds; },
	get minValue() { return minValue; },
	get maxValue() { return maxValue; },
	get shouldCloseOnSelect() { return shouldCloseOnSelect; },
	toggle, openPopover, closePopover, selectDate, updateValue,
});

const styleId = $derived(`date-picker-${intent}`);
</script>

<StyleMacro kind="date-picker" style={styleId}>
<div
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-labelledby={label ? resolvedIds.label : undefined}
	aria-describedby={description ? resolvedIds.description : undefined}
	aria-disabled={isDisabled || undefined}
	data-kind="date-picker"
	data-slot="root"
	data-state={isDisabled ? "disabled" : isInvalid ? "invalid" : undefined}
	class={cn(className)}
	{...rest}
>
	{#if label}
		<label id={resolvedIds.label} for={resolvedIds.field} class="text-sm font-medium" data-kind="date-picker" data-slot="label">
			{label}{#if isRequired}<span aria-hidden="true" class="text-[var(--color-red-400)] ms-2">*</span>{/if}
		</label>
	{/if}

	{@render children?.()}

	{#if description}
		<p id={resolvedIds.description} class="text-xs" data-kind="date-picker" data-slot="description">{description}</p>
	{/if}

	{#if isInvalid && (errorMessage || validationError())}
		<p id={resolvedIds.errorMessage} role="alert" class="text-xs text-red-500" data-kind="date-picker" data-slot="error-message">
			{errorMessage ?? validationError()}
		</p>
	{/if}

	{#if name}
		<input type="hidden" {name} value={currentValue?.toISOString() ?? ""} {form} />
	{/if}
</div>
</StyleMacro>
