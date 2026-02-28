<!--
	@component DateRangeField
	@kind date-range-field
	@layer components

	ColdLight DateRangeField root — manages two segmented date fields for range.
	Compound component: sub-components consume context to render segments.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Spinbutton Pattern
-->
<script lang="ts">
	import type { DateRangeFieldProps } from "./types.js";
	import type { DateSegment } from "./types.js";
	import { setDateRangeFieldContext, type DateRangeFieldContext } from "./context.js";
	import { dateRangeFieldRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		startDate = undefined,
		endDate = undefined,
		onRangeChange,
		granularity = "day",
		locale = "en-US",
		disabled = false,
		readonly: readonlyProp = false,
		size = "md",
		children,
		class: className,
		...rest
	}: DateRangeFieldProps = $props();

	let focusedField = $state<"start" | "end">("start");
	let focusedIndex = $state(0);

	function buildSegments(date: Date | undefined, gran: "day" | "month" | "year"): DateSegment[] {
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

		if (gran === "day" || gran === "month") {
			segs.push({
				type: "literal",
				value: "/",
				placeholder: "/",
				min: 0,
				max: 0,
				numericValue: undefined,
			});
		}

		if (gran === "day") {
			segs.push({
				type: "day",
				value: d !== undefined ? String(d).padStart(2, "0") : "",
				placeholder: "DD",
				min: 1,
				max: 31,
				numericValue: d,
			});
			segs.push({
				type: "literal",
				value: "/",
				placeholder: "/",
				min: 0,
				max: 0,
				numericValue: undefined,
			});
		}

		segs.push({
			type: "year",
			value: y !== undefined ? String(y) : "",
			placeholder: "YYYY",
			min: 1,
			max: 9999,
			numericValue: y,
		});

		return segs;
	}

	const startSegments = $derived(buildSegments(startDate, granularity));
	const endSegments = $derived(buildSegments(endDate, granularity));
	const editableStartSegments = $derived(startSegments.filter((s) => s.type !== "literal"));
	const editableEndSegments = $derived(endSegments.filter((s) => s.type !== "literal"));

	function clampSegment(seg: DateSegment, val: number): number {
		return Math.min(Math.max(val, seg.min), seg.max);
	}

	function rebuildDate(base: Date | undefined, segmentType: string, newValue: number): Date {
		const b = base ?? new Date();
		const y = segmentType === "year" ? newValue : b.getFullYear();
		const m = segmentType === "month" ? newValue - 1 : b.getMonth();
		const d = segmentType === "day" ? newValue : b.getDate();
		return new Date(y, m, d);
	}

	const ctx: DateRangeFieldContext = {
		get startDate() {
			return startDate;
		},
		get endDate() {
			return endDate;
		},
		get startSegments() {
			return startSegments;
		},
		get endSegments() {
			return endSegments;
		},
		get granularity() {
			return granularity;
		},
		get disabled() {
			return disabled;
		},
		get readonly() {
			return readonlyProp;
		},
		get locale() {
			return locale;
		},
		get size() {
			return size;
		},
		get focusedField() {
			return focusedField;
		},
		get focusedIndex() {
			return focusedIndex;
		},
		focusSegment(field: "start" | "end", index: number) {
			focusedField = field;
			focusedIndex = index;
		},
		incrementSegment(field: "start" | "end", index: number) {
			if (disabled || readonlyProp) return;
			const segs = field === "start" ? editableStartSegments : editableEndSegments;
			const seg = segs[index];
			if (!seg) return;
			const current = seg.numericValue ?? seg.min;
			const newVal = clampSegment(seg, current + 1);
			const base = field === "start" ? startDate : endDate;
			const newDate = rebuildDate(base, seg.type, newVal);
			if (field === "start") {
				onRangeChange?.({ start: newDate, end: endDate });
			} else {
				onRangeChange?.({ start: startDate, end: newDate });
			}
		},
		decrementSegment(field: "start" | "end", index: number) {
			if (disabled || readonlyProp) return;
			const segs = field === "start" ? editableStartSegments : editableEndSegments;
			const seg = segs[index];
			if (!seg) return;
			const current = seg.numericValue ?? seg.min;
			const newVal = clampSegment(seg, current - 1);
			const base = field === "start" ? startDate : endDate;
			const newDate = rebuildDate(base, seg.type, newVal);
			if (field === "start") {
				onRangeChange?.({ start: newDate, end: endDate });
			} else {
				onRangeChange?.({ start: startDate, end: newDate });
			}
		},
		setSegmentValue(field: "start" | "end", index: number, numericValue: number) {
			if (disabled || readonlyProp) return;
			const segs = field === "start" ? editableStartSegments : editableEndSegments;
			const seg = segs[index];
			if (!seg) return;
			const clamped = clampSegment(seg, numericValue);
			const base = field === "start" ? startDate : endDate;
			const newDate = rebuildDate(base, seg.type, clamped);
			if (field === "start") {
				onRangeChange?.({ start: newDate, end: endDate });
			} else {
				onRangeChange?.({ start: startDate, end: newDate });
			}
		},
		focusNextSegment() {
			const currentSegs = focusedField === "start" ? editableStartSegments : editableEndSegments;
			if (focusedIndex < currentSegs.length - 1) {
				focusedIndex = focusedIndex + 1;
			} else if (focusedField === "start") {
				focusedField = "end";
				focusedIndex = 0;
			}
		},
		focusPrevSegment() {
			if (focusedIndex > 0) {
				focusedIndex = focusedIndex - 1;
			} else if (focusedField === "end") {
				focusedField = "start";
				focusedIndex = editableStartSegments.length - 1;
			}
		},
	};

	setDateRangeFieldContext(ctx);

	const recipe = $derived(dateRangeFieldRecipe({ size }));

	const rootState = $derived(
		disabled ? "disabled" : readonlyProp ? "readonly" : undefined,
	);
</script>

<div
	role="group"
	class={cn(recipe.root, className)}
	data-kind="date-range-field"
	data-slot="root"
	data-state={rootState}
	{...rest}
>
	{@render children?.()}
</div>
