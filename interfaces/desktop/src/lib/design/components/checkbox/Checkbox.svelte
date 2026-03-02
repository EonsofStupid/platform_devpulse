<!--
	@component Checkbox
	@kind checkbox
	@layer components

	ColdLight Checkbox — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { CheckboxComponentProps } from "./types.js";
	import { createCheckbox } from "$lib/design/api/adapters/coldlight/_internal/checkbox/index.js";
	import CheckboxRoot from "$lib/design/primitives/checkbox/Checkbox.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { checkboxRecipe } from "./recipe.js";

	let {
		intent = "default",
		size = "md",
		checked = false,
		indeterminate = false,
		disabled = false,
		onCheckedChange,
		children,
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
	}: CheckboxComponentProps = $props();

	const builder = createCheckbox({
		checked: () => checked,
		indeterminate: () => indeterminate,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
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
			radius: radius ?? "sm",
		}),
	);

	const classes = $derived(
		cn(checkboxRecipe({ intent, size }), visual.segments, visual.radius, className),
	);
</script>

<CheckboxRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</CheckboxRoot>
