<!--
	@component DateField
	@kind date-field
	@layer components

	ColdLight DateField root — manages segmented date input state.
	Compound component: sub-components consume context to render segments.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Spinbutton Pattern
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { type DateFieldContext, setDateFieldContext } from "./context.js";
import { dateFieldRecipe } from "./recipe.js";
import type { DateFieldProps, DateSegment } from "./types.js";

let {
	value = undefined,
	onValueChange,
	granularity = "day",
	locale = "en-US",
	disabled = false,
	readonly: readonlyProp = false,
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
}: DateFieldProps = $props();

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

const segments = $derived(buildSegments(value, granularity));
const editableSegments = $derived(segments.filter((s) => s.type !== "literal"));

function clampSegment(seg: DateSegment, val: number): number {
	return Math.min(Math.max(val, seg.min), seg.max);
}

function rebuildDate(segmentType: string, newValue: number): Date {
	const base = value ?? new Date();
	const y = segmentType === "year" ? newValue : base.getFullYear();
	const m = segmentType === "month" ? newValue - 1 : base.getMonth();
	const d = segmentType === "day" ? newValue : base.getDate();
	return new Date(y, m, d);
}

const ctx: DateFieldContext = {
	get value() {
		return value;
	},
	get segments() {
		return segments;
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
	get focusedIndex() {
		return focusedIndex;
	},
	focusSegment(index: number) {
		focusedIndex = index;
	},
	incrementSegment(index: number) {
		if (disabled || readonlyProp) return;
		const seg = editableSegments[index];
		if (!seg) return;
		const current = seg.numericValue ?? seg.min;
		const newVal = clampSegment(seg, current + 1);
		onValueChange?.(rebuildDate(seg.type, newVal));
	},
	decrementSegment(index: number) {
		if (disabled || readonlyProp) return;
		const seg = editableSegments[index];
		if (!seg) return;
		const current = seg.numericValue ?? seg.min;
		const newVal = clampSegment(seg, current - 1);
		onValueChange?.(rebuildDate(seg.type, newVal));
	},
	setSegmentValue(index: number, numericValue: number) {
		if (disabled || readonlyProp) return;
		const seg = editableSegments[index];
		if (!seg) return;
		const clamped = clampSegment(seg, numericValue);
		onValueChange?.(rebuildDate(seg.type, clamped));
	},
	focusNextSegment() {
		const nextIdx = Math.min(focusedIndex + 1, editableSegments.length - 1);
		focusedIndex = nextIdx;
	},
	focusPrevSegment() {
		const prevIdx = Math.max(focusedIndex - 1, 0);
		focusedIndex = prevIdx;
	},
};

setDateFieldContext(ctx);

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

const recipe = $derived(dateFieldRecipe({ size }));

const rootState = $derived(disabled ? "disabled" : readonlyProp ? "readonly" : undefined);
</script>

<div
	role="group"
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="date-field"
	data-slot="root"
	data-state={rootState}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
