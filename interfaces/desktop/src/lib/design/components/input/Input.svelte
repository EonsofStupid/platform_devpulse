<!--
	@component Input
	@kind input
	@layer components

	ColdLight Input — builder-driven, 8-axis visual system.
	Builder owns ARIA. useColdLight() resolves visual props.
	Default preset: input-default.
-->
<script lang="ts">
	import type { InputComponentProps } from "./types.js";
	import { createInput } from "$lib/design/api/adapters/coldlight/_internal/input/index.js";
	import InputRoot from "$lib/design/primitives/input/Input.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { inputRecipe } from "./recipe.js";

	let {
		size = "md",
		value,
		invalid = false,
		disabled = false,
		readonly: readonlyProp = false,
		required: requiredProp = false,
		onValueChange,
		class: className,
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
		...rest
	}: InputComponentProps = $props();

	const builder = createInput({
		value: () => value as string | undefined,
		disabled: () => disabled,
		readonly: () => readonlyProp,
		required: () => requiredProp,
		invalid: () => invalid,
		onValueChange: (v: any) => onValueChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "input-default",
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
		cn(inputRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<InputRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
