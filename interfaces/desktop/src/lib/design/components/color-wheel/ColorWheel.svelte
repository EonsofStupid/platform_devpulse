<!--
	@component Color Wheel
	@kind color-wheel
	@layer component
	@category interactive
	@description Circular hue selector for picking colors along the 360-degree color spectrum
	@container false
	@compound true
	@blockCategory form
	@defaultStyle color-wheel-default
	@styleIds color-wheel-default
	@requiredAxes border
	@slots root:all, track:none, thumb:none
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
import { createIds } from "$lib/design/behaviors/_internal/utils/uid.js";
import { setColorWheelContext } from "./context.js";
import { useWheelDrag } from "./use-wheel-drag.svelte.js";
import type { ColorWheelRootProps } from "./types.js";

let {
	ids: userIds,
	value: controlledValue,
	defaultValue = "hsl(0, 100%, 50%)",
	onChange,
	onChangeEnd,
	isDisabled = false,
	size = 192,
	name,
	form,
	dir = "ltr",
	children,
	preset = "default",
	class: className,
	...rest
}: ColorWheelRootProps = $props();

const autoIds = createIds("color-wheel", ["root", "track", "thumb"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	track: userIds?.track ?? autoIds.track,
	thumb: userIds?.thumb ?? autoIds.thumb,
});

let internalHue = $state(0);

$effect(() => {
	if (controlledValue !== undefined) {
		// Parse hue from controlled value if possible
		const match = controlledValue.match(/(\d+)/);
		if (match) internalHue = Number(match[1]) % 360;
	}
});

const currentHue = $derived(internalHue);

function buildColorString(hue: number): string {
	return `hsl(${Math.round(hue)}, 100%, 50%)`;
}

const drag = useWheelDrag({
	disabled: () => isDisabled,
	step: () => 1,
	onChange(hue) {
		internalHue = hue;
		onChange?.({ value: buildColorString(hue), hue });
	},
	onChangeEnd(hue) {
		onChangeEnd?.({ value: buildColorString(hue), hue });
	},
});


setColorWheelContext({
	get hue() { return currentHue; },
	get isDisabled() { return isDisabled; },
	get isDragging() { return drag.state.isDragging; },
	get size() { return size; },
	get dir() { return dir; },
	get ids() { return resolvedIds; },
	trackAction: drag.trackAction,
	thumbAction: drag.thumbAction,
});

const m = $derived(resolveMacro({ kind: "color-wheel", preset }));
</script>

<div
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-label="Color wheel"
	aria-disabled={isDisabled || undefined}
	{...m.dataAttrs}
	data-slot="root"
	data-dragging={drag.state.isDragging || undefined}
	style={cssVarString(m.cssVars)}
	class={cn(className)}
	style:width="{size}px"
	style:height="{size}px"
	{...rest}
>
	{@render children?.()}

	{#if name}
		<input type="hidden" {name} value={currentHue} {form} />
	{/if}
</div>
