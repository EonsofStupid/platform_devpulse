<!--
	@component Toggle
	@kind toggle
	@layer components

	ColdLight Toggle — MeltUI transport + 8-axis visual system.
-->
<script lang="ts">
	import type { ToggleProps } from "./types.js";
	import { createToggleTransport } from "$lib/design/api/dsadapters/meltui/_internal/toggle/index.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { toggleRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		pressed = false,
		onPressedChange,
		disabled = false,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: ToggleProps = $props();

	const transport = createToggleTransport({
		get disabled() { return disabled; },
		get value() { return pressed; },
	});

	$effect(() => {
		if (onPressedChange && transport.states.pressed !== pressed) {
			onPressedChange(transport.states.pressed);
		}
	});

	const visual = useColdLight(
		() => ({
			preset,
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(
		cn(toggleRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	class={classes}
	data-kind="toggle"
	data-slot="root"
	data-state={transport.states.pressed ? "on" : "off"}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</button>
