<!--
	@component DatePicker (Root)
	@kind date-picker
	@layer components

	Combines DateField segmented input + Calendar popover.
	Manages value state + popover open state.
	Sets context for sub-components.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
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
	preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
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

// Recipe
const recipe = getRecipe("date-picker.glass.void");
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

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
	get classes() { return recipeClasses; },
	get ids() { return resolvedIds; },
	get minValue() { return minValue; },
	get maxValue() { return maxValue; },
	get shouldCloseOnSelect() { return shouldCloseOnSelect; },
	toggle, openPopover, closePopover, selectDate, updateValue,
});

// Visual
const visual = useColdLight(() => ({
	preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
}));

const rootClasses = $derived(cn(recipeClasses.root, visual.segments, visual.radius, className));
</script>

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
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	{...rest}
>
	{#if label}
		<label id={resolvedIds.label} for={resolvedIds.field} class={recipeClasses.label} data-kind="date-picker" data-slot="label">
			{label}{#if isRequired}<span aria-hidden="true" class="text-[var(--color-red-400)] ms-2">*</span>{/if}
		</label>
	{/if}

	{@render children?.()}

	{#if description}
		<p id={resolvedIds.description} class={recipeClasses.description} data-kind="date-picker" data-slot="description">{description}</p>
	{/if}

	{#if isInvalid && (errorMessage || validationError())}
		<p id={resolvedIds.errorMessage} role="alert" class={recipeClasses.errorMessage} data-kind="date-picker" data-slot="error-message">
			{errorMessage ?? validationError()}
		</p>
	{/if}

	{#if name}
		<input type="hidden" {name} value={currentValue?.toISOString() ?? ""} {form} />
	{/if}
</div>
