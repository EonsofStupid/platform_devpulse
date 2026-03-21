<!--
	@component ColorWheel (Root)
	@kind color-wheel
	@layer components

	Circular hue picker. Drags thumb around a ring for hue 0-360.
	$state/$effect/$derived for controlled sync and reactive recipe.
	Auto-generated IDs. Form integration via hidden input.
-->
<script lang="ts">
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
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

const recipe = getRecipe("color-wheel.glass.void");
const recipeClasses = $derived(
	// biome-ignore lint/suspicious/noExplicitAny: recipe boundary
	recipe?.classes?.({} as any) ?? {},
);

setColorWheelContext({
	get hue() { return currentHue; },
	get isDisabled() { return isDisabled; },
	get isDragging() { return drag.state.isDragging; },
	get size() { return size; },
	get dir() { return dir; },
	get classes() { return recipeClasses; },
	get ids() { return resolvedIds; },
	trackAction: drag.trackAction,
	thumbAction: drag.thumbAction,
});
</script>

<div
	id={resolvedIds.root}
	{dir}
	role="group"
	aria-label="Color wheel"
	aria-disabled={isDisabled || undefined}
	data-kind="color-wheel"
	data-slot="root"
	data-dragging={drag.state.isDragging || undefined}
	class={cn(recipeClasses.root, className)}
	style:width="{size}px"
	style:height="{size}px"
	{...rest}
>
	{@render children?.()}

	{#if name}
		<input type="hidden" {name} value={currentHue} {form} />
	{/if}
</div>
