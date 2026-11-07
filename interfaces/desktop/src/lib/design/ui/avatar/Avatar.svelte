<!--
	@component AvatarUI
	@kind avatar
	@layer ui

	Styled ColdLight Avatar — COMPONENT + RECIPE = visual output.
	Passes imageClass and fallbackClass to component for slot styling.
-->
<script lang="ts">
	import type { AvatarUIProps } from "./types.js";
	import Avatar from "$lib/design/components/avatar/Avatar.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { avatarRootRecipe, avatarImageRecipe, avatarFallbackRecipe } from "$lib/design/components/avatar/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		size = "md",
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
		// Component props (forwarded)
		class: className,
		...rest
	}: AvatarUIProps = $props();

	const visual = useColdLight(
		() => ({
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
			radius: radius ?? "full",
			size,
		}),
	);

	const rootClasses = $derived(cn(avatarRootRecipe({ size }), visual.segments, visual.radius, className));
	const imageClasses = $derived(cn(avatarImageRecipe()));
	const fallbackClasses = $derived(cn(avatarFallbackRecipe()));
</script>

<Avatar {...rest} imageClass={imageClasses} fallbackClass={fallbackClasses} class={rootClasses} data-encoding={visual.encoding || undefined} />
