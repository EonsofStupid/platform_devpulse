<!--
	@component Switch
	@kind switch
	@layer components

	ColdLight Switch — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { SwitchProps } from "./types.js";
	import { createSwitch } from "$lib/design/api/dsadapters/coldlight/_internal/switch/index.js";
	import SwitchRoot from "$lib/design/primitives/switch/Switch.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { switchRecipe, switchThumbRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		checked = false,
		disabled = false,
		onCheckedChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: SwitchProps = $props();

	const builder = createSwitch({
		checked: () => checked,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "input-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "full",
		}),
	);

	const classes = $derived(cn(switchRecipe({ size }), visual.segments, visual.radius, className));
	const thumbClasses = $derived(switchThumbRecipe({ size, checked }));
</script>

<SwitchRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	<span {...builder.thumb} class={thumbClasses} data-slot="thumb"></span>
	{@render children?.()}
</SwitchRoot>
