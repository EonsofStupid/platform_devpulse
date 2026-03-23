<!--
	@component ColorArea (Root)
	@kind color-area
	@layer components

	2D color picker surface. Pointer drag on root, keyboard on thumb.
	Interaction via useColorAreaDrag Svelte action.
	Real color values via channel ranges per color space.
	Reactive recipe classes via $derived.
-->
<script lang="ts">
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
	defaultValue = "",
	onChange,
	onChangeEnd,
	isDisabled = false,
	form,
	dir = "ltr",
	step = 1,
	children,
	class: className,
	...rest
}: ColorAreaRootProps = $props();

let internalValue = $state(defaultValue);
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

const recipeClasses = $derived(
		recipe?.classes?.({} as any) ?? {});

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

const rootClasses = $derived(
	cn(
		isDisabled ? "pointer-events-none opacity-60" : undefined,
		className));
</script>

<div
	id={ids?.root}
	{dir}
	role="group"
	aria-roledescription="2d color picker"
	aria-label="Color picker"
	aria-disabled={isDisabled || undefined}
	data-kind="color-area"
	data-slot="root"
	data-dragging={drag.state.isDragging || undefined}
	class={rootClasses}
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
