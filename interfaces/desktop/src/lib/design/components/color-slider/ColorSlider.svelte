<!--
	@component Color Slider
	@kind color-slider
	@layer component
	@category interactive
	@description Single-axis slider for adjusting one channel of a color value such as hue or alpha
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/slider/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle color-slider-default
	@styleIds color-slider-default
	@requiredAxes border, borderRadius
	@slots root:all, track:none, thumb:none, label:none
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
import { colorSliderAnatomy } from "$lib/design/behaviors/inputs/color-slider/index.js";
import {
	getChannelRange,
	percentToValue,
	roundToStep,
} from "$lib/design/components/color-area/color-utils.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setColorSliderContext } from "./context.js";
import type { ColorSliderRootProps } from "./types.js";
import { useSliderDrag } from "./use-slider-drag.svelte.js";

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
	preset = "default",
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
let internalValue = $state("");

$effect(() => {
	if (controlledValue !== undefined) {
		internalValue = controlledValue;
	} else if (internalValue === "" && defaultValue !== undefined) {
		internalValue = defaultValue;
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

// ── Context ─────────────────────────────────────────────────────
setColorSliderContext({
	get value() {
		return currentValue;
	},
	get channel() {
		return channel;
	},
	get colorSpace() {
		return colorSpace;
	},
	get orientation() {
		return orientation;
	},
	get isDisabled() {
		return isDisabled;
	},
	get isDragging() {
		return drag.state.isDragging;
	},
	get percent() {
		return drag.state.percent;
	},
	get channelValue() {
		return channelValue;
	},
	get channelMin() {
		return range.min;
	},
	get channelMax() {
		return range.max;
	},
	get dir() {
		return dir;
	},
	get ids() {
		return resolvedIds;
	},
	trackAction: drag.trackAction,
	thumbAction: drag.thumbAction,
});

const m = $derived(renderForge({ kind: "color-slider", preset }));
</script>

<div
	{...colorSliderAnatomy.attrs.root}
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-label={label ?? `${channel} slider`}
	aria-disabled={isDisabled || undefined}
	{...rest}
	{...m.dataAttrs}
	data-orientation={orientation}
	data-dragging={drag.state.isDragging || undefined}
	style={cssVarString(m.cssVars)}
	class={cn(
		orientation === "vertical" ? "flex-col" : "flex-row",
		isDisabled ? "pointer-events-none opacity-60" : undefined,
		className)}
>
	{#if label}
		<label id={resolvedIds.label} for={resolvedIds.input} data-kind="color-slider" data-slot="label">
			{label}
			<span>{channelValue}</span>
		</label>
	{/if}

	{@render children?.()}

	{#if name}
		<input type="hidden" id={resolvedIds.input} {name} value={channelValue} {form} />
	{/if}
</div>
