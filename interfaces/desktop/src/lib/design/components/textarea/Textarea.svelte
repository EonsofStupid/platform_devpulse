<!--
	@component Textarea
	@kind textarea
	@layer components

	ColdLight Textarea — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { TextareaProps } from "./types.js";
	import { createTextarea } from "$lib/design/api/dsadapters/coldlight/_internal/textarea/index.js";
	import TextareaRoot from "$lib/design/primitives/textarea/Textarea.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { textareaRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		disabled = false,
		readonly: readOnly = false,
		required = false,
		invalid = false,
		rows,
		onValueChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		class: className,
		...rest
	}: TextareaProps = $props();

	const builder = createTextarea({
		disabled: () => disabled,
		readonly: () => readOnly,
		required: () => required,
		invalid: () => invalid,
		rows: () => rows,
		onValueChange: (v: any) => onValueChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "textarea-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md",
		}),
	);

	const classes = $derived(
		cn(textareaRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<TextareaRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined} />
