<!--
	@component Textarea
	@kind textarea
	@layer components

	ColdLight Textarea — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA semantics. useColdLight() resolves visual props.
	Textarea is self-closing — no children snippet.
-->
<script lang="ts">
	import type { TextareaComponentProps } from "./types.js";
	import { createTextarea } from "$lib/design/api/adapters/coldlight/_internal/textarea/index.js";
	import TextareaRoot from "$lib/design/primitives/textarea/Textarea.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { textareaRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		size = "md",
		value,
		invalid = false,
		rows = 3,
		disabled = false,
		readonly: readonlyProp = false,
		required = false,
		onValueChange,
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
	}: TextareaComponentProps = $props();

	const builder = createTextarea({
		value: () => value as string | undefined,
		disabled: () => disabled,
		readonly: () => readonlyProp,
		required: () => required,
		invalid: () => invalid,
		rows: () => rows,
		onValueChange: (v: any) => onValueChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "textarea-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md", size,
		}),
	);

	const classes = $derived(
		cn(textareaRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<TextareaRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
