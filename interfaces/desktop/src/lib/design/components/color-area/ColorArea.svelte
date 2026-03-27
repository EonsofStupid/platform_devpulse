<!--
	@component Color Area
	@kind color-area
	@layer component
	@category interactive
	@description Two-dimensional gradient surface for selecting saturation and lightness of a color
	@container false
	@compound true
	@blockCategory form
	@defaultStyle color-area-default
	@styleIds color-area-default
	@requiredAxes border, borderRadius
	@slots root:all, gradient:none, thumb:none
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
import { resolveMacro, cssVarString } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { buildColorString, getChannelRange, percentToValue } from "./color-utils.js";
import { setColorAreaContext } from "./context.js";
import { useColorAreaDrag } from "./use-color-area-drag.svelte.js";
import type { ColorAreaRootProps } from "./types.js";

let {
	ids,
	colorSpace = "oklch",
	xChannel,
	yChannel,
	xName,
	yName,
	value: controlledValue,
	defaultValue,
	onChange,
	onChangeEnd,
	isDisabled = false,
	form,
	dir = "ltr",
	step = 1,
	children,
	preset = "default",
	class: className,
	...rest
}: ColorAreaRootProps = $props();

let internalValue = $state("");
$effect.pre(() => { if (controlledValue !== undefined) { internalValue = controlledValue; } else if (internalValue === "" && defaultValue) { internalValue = defaultValue; } });
const currentValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

const xRange = $derived(getChannelRange(colorSpace, xChannel));
const yRange = $derived(getChannelRange(colorSpace, yChannel));

function emitColor(x: number, y: number) {
	const xVal = percentToValue(x, xRange);
	const yVal = percentToValue(y, yRange);
	return buildColorString(colorSpace, xChannel, xVal, yChannel, yVal);
}

const drag = useColorAreaDrag({
	disabled: () => isDisabled,
	rtl: () => dir === "rtl",
	step: () => (step / 100),
	onChange(x, y) {
		const val = emitColor(x, y);
		internalValue = val;
		onChange?.({ value: val });
	},
	onChangeEnd(x, y) {
		onChangeEnd?.({ value: emitColor(x, y) });
	},
});

const xValue = $derived(percentToValue(drag.state.xPercent, xRange));
const yValue = $derived(percentToValue(drag.state.yPercent, yRange));


setColorAreaContext({
	get value() { return currentValue; },
	get colorSpace() { return colorSpace; },
	get xChannel() { return xChannel; },
	get yChannel() { return yChannel; },
	get isDisabled() { return isDisabled; },
	get isDragging() { return drag.state.isDragging; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get xPercent() { return drag.state.xPercent; },
	get yPercent() { return drag.state.yPercent; },
	thumbAction: drag.thumbAction,
});

const m = $derived(resolveMacro({ kind: "color-area", preset }));
</script>

<div
	id={ids?.root}
	{dir}
	role="group"
	aria-roledescription="2d color picker"
	aria-label="Color picker"
	aria-disabled={isDisabled || undefined}
	{...m.dataAttrs}
	data-slot="root"
	data-dragging={drag.state.isDragging || undefined}
	style={cssVarString(m.cssVars)}
	class={cn(isDisabled ? "pointer-events-none opacity-60" : undefined, className)}
	use:drag.action
	{...rest}
>
	{@render children?.()}

	{#if xName}
		<input type="hidden" name={xName} value={xValue} {form} />
	{/if}
	{#if yName}
		<input type="hidden" name={yName} value={yValue} {form} />
	{/if}
</div>
