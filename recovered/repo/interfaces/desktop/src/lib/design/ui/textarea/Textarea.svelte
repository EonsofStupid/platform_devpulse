<!--
	@component TextareaUI
	@kind textarea
	@layer ui

	Styled ColdLight Textarea — COMPONENT + RECIPE = visual output.
	Self-closing — no children.
-->
<script lang="ts">
	import type { TextareaUIProps } from "./types.js";
	import Textarea from "$lib/design/components/textarea/Textarea.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { textareaRecipe } from "$lib/design/components/textarea/recipe.js";
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
	}: TextareaUIProps = $props();

	const visual = useColdLight(
		() => ({
			preset: preset ?? "textarea-default",
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "md",
			size,
		}),
	);

	const classes = $derived(
		cn(textareaRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<Textarea {...rest} class={classes} data-encoding={visual.encoding || undefined} />
