<!--
	@component ColorSlider (Root)
	@kind color-slider
	@layer components

	1D color channel slider. Single thumb on a gradient track.
	Svelte 5: $state, $derived, $effect for controlled sync.
	Auto-generated IDs. Real channel values via color-utils.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { getChannelRange, percentToValue, roundToStep } from "$lib/design/components/color-area/color-utils.js";
import { setColorSliderContext } from "./context.js";
import { useSliderDrag } from "./use-slider-drag.svelte.js";
import type { ColorSliderRootProps } from "./types.js";

let {
	ids: userIds,
	channel,
	colorSpace = "oklch",
	orientation = "horizontal",
	value: controlledValue,
	defaultValue = "",
	onChange,
	onChangeEnd,
	isDisabled = false,
	label,
	name,
	form,
	dir = "ltr",
	step = 1,
	children,
	class: className,
	...rest
}: ColorSliderRootProps = $props();

// ── IDs ─────────────────────────────────────────────────────────
const autoIds = createIds("color-slider", ["root", "track", "thumb", "label", "input"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	track: userIds?.track ?? autoIds.track,
	thumb: userIds?.thumb ?? autoIds.thumb,
	label: userIds?.label ?? autoIds.label,
	input: userIds?.input ?? autoIds.input,
});

// ── Channel range ───────────────────────────────────────────────
const range = $derived(getChannelRange(colorSpace, channel));

// ── Value state ─────────────────────────────────────────────────
let internalValue = $state(defaultValue);

$effect(() => {
	if (controlledValue !== undefined) {
		internalValue = controlledValue;
	}
});

const currentValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

// ── Drag action ─────────────────────────────────────────────────
const drag = useSliderDrag({
	disabled: () => isDisabled,
	rtl: () => dir === "rtl",
	vertical: () => orientation === "vertical",
	step: () => step / (range.max - range.min),
	onChange(pct) {
		const channelVal = roundToStep(percentToValue(pct, range), range.step);
		const val = `${colorSpace}(${channel}:${channelVal})`;
		internalValue = val;
		onChange?.({ value: val });
	},
	onChangeEnd(pct) {
		const channelVal = roundToStep(percentToValue(pct, range), range.step);
		onChangeEnd?.({ value: `${colorSpace}(${channel}:${channelVal})` });
	},
});

// ── Derived channel value ───────────────────────────────────────
const channelValue = $derived(roundToStep(percentToValue(drag.state.percent, range), range.step));

// ── Recipe (reactive) ───────────────────────────────────────────
		recipe?.classes?.({} as any) ?? {});

// ── Context ─────────────────────────────────────────────────────
setColorSliderContext({
	get value() { return currentValue; },
	get channel() { return channel; },
	get colorSpace() { return colorSpace; },
	get orientation() { return orientation; },
	get isDisabled() { return isDisabled; },
	get isDragging() { return drag.state.isDragging; },
	get percent() { return drag.state.percent; },
	get channelValue() { return channelValue; },
	get channelMin() { return range.min; },
	get channelMax() { return range.max; },
	get dir() { return dir; },
	get ids() { return resolvedIds; },
	trackAction: drag.trackAction,
	thumbAction: drag.thumbAction,
});

// ── Visual ──────────────────────────────────────────────────────
const rootClasses = $derived(
	cn(
		orientation === "vertical" ? "flex-col" : "flex-row",
		isDisabled ? "pointer-events-none opacity-60" : undefined,
		className));
</script>

<div
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-label={label ?? `${channel} slider`}
	aria-orientation={orientation}
	aria-disabled={isDisabled || undefined}
	data-kind="color-slider"
	data-slot="root"
	data-orientation={orientation}
	data-dragging={drag.state.isDragging || undefined}
	class={rootClasses}
	{...rest}
>
	{#if label}
		<label id={resolvedIds.label} for={resolvedIds.input} class={} data-kind="color-slider" data-slot="label">
			{label}
			<span class={}>{channelValue}</span>
		</label>
	{/if}

	{@render children?.()}

	{#if name}
		<input type="hidden" id={resolvedIds.input} {name} value={channelValue} {form} />
	{/if}
</div>
