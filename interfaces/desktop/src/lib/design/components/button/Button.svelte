<!--
	@component Button
	@kind button
	@layer components

	ColdLight Button — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { ButtonProps } from "./types.js";
	import { BUTTON_INTENT_PRESETS } from "./types.js";
	import { createButton } from "$lib/design/api/adapters/coldlight/_internal/button/index.js";
	import ButtonRoot from "$lib/design/primitives/button/Button.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { buttonRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		intent = "primary",
		size = "md",
		pressed,
		onPressedChange,
		loading = false,
		disabled = false,
		expanded,
		type,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: ButtonProps = $props();

	const builder = createButton({
		disabled: () => disabled,
		pressed: () => pressed,
		loading: () => loading,
		expanded: () => expanded,
		type: () => type,
		onPressedChange: (v) => onPressedChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? BUTTON_INTENT_PRESETS[intent as keyof typeof BUTTON_INTENT_PRESETS],
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "lg", size,
		}),
	);

	const classes = $derived(
		cn(buttonRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<ButtonRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</ButtonRoot>
