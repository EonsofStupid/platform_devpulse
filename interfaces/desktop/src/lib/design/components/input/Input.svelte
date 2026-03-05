<!--
	@component Input
	@kind input
	@layer components

	ColdLight Input — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { InputProps } from "./types.js";
	import { createInput } from "$lib/design/api/dsadapters/coldlight/_internal/input/index.js";
	import InputRoot from "$lib/design/primitives/input/Input.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { inputRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		disabled = false,
		readonly: readOnly = false,
		required = false,
		type: inputType,
		invalid = false,
		onValueChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		class: className,
		...rest
	}: InputProps = $props();

	const builder = createInput({
		disabled: () => disabled,
		readonly: () => readOnly,
		required: () => required,
		type: () => inputType,
		invalid: () => invalid,
		onValueChange: (v: any) => onValueChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "input-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md",
		}),
	);

	const classes = $derived(
		cn(inputRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<InputRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined} />
