<!--
	@component Toggle
	@kind toggle
	@layer components

	ColdLight Toggle — MeltUI transport-driven component.
	Transport owns ARIA semantics (aria-pressed). Component adds recipe classes.
	Reference: WAI-ARIA APG Button Pattern (Toggle)
-->
<script lang="ts">
	import type { ToggleComponentProps } from "./types.js";
	import { createToggleTransport } from "$lib/design/api/adapters/meltui/_internal/toggle/index.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { toggleRecipe } from "./recipe.js";

	let {
		pressed = false,
		onPressedChange,
		disabled = false,
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
	}: ToggleComponentProps = $props();

	const transport = createToggleTransport({
		get disabled() { return disabled; },
		get value() { return pressed; },
	});

	$effect(() => {
		transport.states.pressed = pressed;
	});

	$effect(() => {
		if (transport.states.pressed !== pressed) {
			onPressedChange?.(transport.states.pressed);
		}
	});

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(toggleRecipe({ size }), visual.segments, visual.radius, className));
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	class={classes}
	data-kind="toggle"
	data-slot="trigger"
	data-encoding={visual.encoding || undefined}
	data-state={pressed ? "on" : "off"}
	{disabled}
	onclick={() => {
		if (!disabled) {
			const next = !pressed;
			transport.states.pressed = next;
			onPressedChange?.(next);
		}
	}}
>
	{@render children?.()}
</button>
