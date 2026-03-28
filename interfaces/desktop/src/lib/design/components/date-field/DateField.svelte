<!--
	@component Date Field
	@kind date-field
	@layer component
	@category interactive
	@description Segmented date input with individual fields for month, day, and year
	@container false
	@compound true
	@blockCategory form
	@defaultStyle date-field-default
	@styleIds date-field-default
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, segment:none, label:none
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
import { createIds } from "$lib/design/behaviors/_internal/utils/uid.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { setDateFieldContext } from "./context.js";
import type { DateFieldRootProps, DateSegment } from "./types.js";

let {
	ids: userIds,
	value: controlledValue,
	defaultValue = null,
	onChange,
	granularity = "day",
	locale = "en-US",
	size = "md",
	isDisabled = false,
	isReadOnly = false,
	isRequired = false,
	isInvalid: controlledInvalid = false,
	minValue,
	maxValue,
	validate,
	label,
	description,
	errorMessage,
	name,
	form,
	dir = "ltr",
	preset = "default",
	children,
	class: className,
	...rest
}: DateFieldRootProps = $props();
const m = $derived(resolveMacro({ kind: "date-field", preset }));

const autoIds = createIds("date-field", ["root", "label", "description", "errorMessage"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	label: userIds?.label ?? autoIds.label,
	description: userIds?.description ?? autoIds.description,
	errorMessage: userIds?.errorMessage ?? autoIds.errorMessage,
});

let internalValue = $state<Date | null>(null);
$effect(() => {
	if (controlledValue !== undefined) {
		internalValue = controlledValue;
	} else if (internalValue === null && defaultValue !== undefined) {
		internalValue = defaultValue;
	}
});
const currentValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

const validationError = $derived(() => {
	if (!validate || !currentValue) return null;
	return validate(currentValue) ?? null;
});
const isInvalid = $derived(controlledInvalid || validationError() !== null);

let focusedIndex = $state(0);

function buildSegments(date: Date | null | undefined, gran: string): DateSegment[] {
	const segs: DateSegment[] = [];
	const m = date ? date.getMonth() + 1 : undefined;
	const d = date ? date.getDate() : undefined;
	const y = date ? date.getFullYear() : undefined;

	segs.push({
		type: "month",
		value: m !== undefined ? String(m).padStart(2, "0") : "",
		placeholder: "MM",
		min: 1,
		max: 12,
		numericValue: m,
	});
	if (gran !== "month" && gran !== "year") {
		segs.push({
			type: "literal",
			value: "/",
			placeholder: "/",
			min: 0,
			max: 0,
			numericValue: undefined,
		});
		segs.push({
			type: "day",
			value: d !== undefined ? String(d).padStart(2, "0") : "",
			placeholder: "DD",
			min: 1,
			max: 31,
			numericValue: d,
		});
	}
	segs.push({
		type: "literal",
		value: "/",
		placeholder: "/",
		min: 0,
		max: 0,
		numericValue: undefined,
	});
	segs.push({
		type: "year",
		value: y !== undefined ? String(y) : "",
		placeholder: "YYYY",
		min: 1,
		max: 9999,
		numericValue: y,
	});

	if (gran === "hour" || gran === "minute" || gran === "second") {
		const h = date ? date.getHours() : undefined;
		const min = date ? date.getMinutes() : undefined;
		segs.push({
			type: "literal",
			value: " ",
			placeholder: " ",
			min: 0,
			max: 0,
			numericValue: undefined,
		});
		segs.push({
			type: "hour",
			value: h !== undefined ? String(h).padStart(2, "0") : "",
			placeholder: "HH",
			min: 0,
			max: 23,
			numericValue: h,
		});
		segs.push({
			type: "literal",
			value: ":",
			placeholder: ":",
			min: 0,
			max: 0,
			numericValue: undefined,
		});
		segs.push({
			type: "minute",
			value: min !== undefined ? String(min).padStart(2, "0") : "",
			placeholder: "MM",
			min: 0,
			max: 59,
			numericValue: min,
		});
		if (gran === "second") {
			const s = date ? date.getSeconds() : undefined;
			segs.push({
				type: "literal",
				value: ":",
				placeholder: ":",
				min: 0,
				max: 0,
				numericValue: undefined,
			});
			segs.push({
				type: "second",
				value: s !== undefined ? String(s).padStart(2, "0") : "",
				placeholder: "SS",
				min: 0,
				max: 59,
				numericValue: s,
			});
		}
	}
	return segs;
}

const segments = $derived(buildSegments(currentValue, granularity));
const editableSegments = $derived(segments.filter((s) => s.type !== "literal"));

function clamp(seg: DateSegment, val: number): number {
	return Math.min(Math.max(val, seg.min), seg.max);
}

function rebuildDate(segType: string, newVal: number): Date {
	const base = currentValue ?? new Date();
	return new Date(
		segType === "year" ? newVal : base.getFullYear(),
		segType === "month" ? newVal - 1 : base.getMonth(),
		segType === "day" ? newVal : base.getDate(),
		segType === "hour" ? newVal : base.getHours(),
		segType === "minute" ? newVal : base.getMinutes(),
		segType === "second" ? newVal : base.getSeconds(),
	);
}

function emitChange(date: Date) {
	internalValue = date;
	onChange?.({ value: date });
}

setDateFieldContext({
	get value() {
		return currentValue;
	},
	get segments() {
		return segments;
	},
	get granularity() {
		return granularity;
	},
	get isDisabled() {
		return isDisabled;
	},
	get isReadOnly() {
		return isReadOnly;
	},
	get isRequired() {
		return isRequired;
	},
	get isInvalid() {
		return isInvalid;
	},
	get locale() {
		return locale;
	},
	get size() {
		return size;
	},
	get dir() {
		return dir;
	},
	get ids() {
		return resolvedIds;
	},
	get focusedIndex() {
		return focusedIndex;
	},
	focusSegment(i) {
		focusedIndex = i;
	},
	incrementSegment(i) {
		if (isDisabled || isReadOnly) return;
		const s = editableSegments[i];
		if (s) emitChange(rebuildDate(s.type, clamp(s, (s.numericValue ?? s.min) + 1)));
	},
	decrementSegment(i) {
		if (isDisabled || isReadOnly) return;
		const s = editableSegments[i];
		if (s) emitChange(rebuildDate(s.type, clamp(s, (s.numericValue ?? s.min) - 1)));
	},
	setSegmentValue(i, v) {
		if (isDisabled || isReadOnly) return;
		const s = editableSegments[i];
		if (s) emitChange(rebuildDate(s.type, clamp(s, v)));
	},
	focusNextSegment() {
		focusedIndex = Math.min(focusedIndex + 1, editableSegments.length - 1);
	},
	focusPrevSegment() {
		focusedIndex = Math.max(focusedIndex - 1, 0);
	},
});
</script>

<div
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-labelledby={label ? resolvedIds.label : undefined}
	aria-describedby={description ? resolvedIds.description : undefined}
	aria-disabled={isDisabled || undefined}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	data-slot="root"
	data-state={isDisabled ? "disabled" : isReadOnly ? "readonly" : isInvalid ? "invalid" : undefined}
	class={cn(className)}
	{...rest}
>
	{#if label}
		<span id={resolvedIds.label} class="text-sm font-medium" data-kind="date-field" data-slot="label">
			{label}{#if isRequired}<span aria-hidden="true" class="text-[var(--color-red-400)] ms-2">*</span>{/if}
		</span>
	{/if}

	{@render children?.()}

	{#if description}
		<p id={resolvedIds.description} class="text-xs" data-kind="date-field" data-slot="description">{description}</p>
	{/if}

	{#if isInvalid && (errorMessage || validationError())}
		<p id={resolvedIds.errorMessage} role="alert" class="text-xs text-red-500" data-kind="date-field" data-slot="error-message">
			{errorMessage ?? validationError()}
		</p>
	{/if}

	{#if name}
		<input type="hidden" {name} value={currentValue?.toISOString() ?? ""} {form} />
	{/if}
</div>
