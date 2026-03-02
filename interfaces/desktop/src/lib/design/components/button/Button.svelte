<!--
	@component Button
	@kind button
	@layer components

	ColdLight Button — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
	Intent maps to named preset: primary → btn-primary.
	Individual ColdLight props override preset values.

	Usage:
	  <Button intent="primary" />
	  <Button intent="primary" glow="teal" />
	  <Button preset="btn-ghost" surface="glass-void" />
	  <Button surface="glass-deep" depth="z2" bevel="subtle" />
-->
<script lang="ts">
	import type { ButtonComponentProps } from "./types.js";
	import { BUTTON_INTENT_PRESETS } from "./types.js";
	import { createButton } from "$lib/design/api/adapters/coldlight/_internal/button/index.js";
	import ButtonRoot from "$lib/design/primitives/button/Button.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { buttonRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		intent = "primary",
		size = "md",
		pressed,
		onPressedChange,
		loading = false,
		disabled = false,
		expanded,
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
	}: ButtonComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createButton({
		disabled: () => disabled,
		pressed: () => pressed,
		loading: () => loading,
		expanded: () => expanded,
		onPressedChange: (v: any) => onPressedChange?.(v),
	});

	// Resolve ColdLight visual: intent → preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? BUTTON_INTENT_PRESETS[intent as keyof typeof BUTTON_INTENT_PRESETS],
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "lg",
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(buttonRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<ButtonRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</ButtonRoot>
