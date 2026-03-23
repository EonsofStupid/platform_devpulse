<!--
	@component Checkbox
	@kind checkbox
	@layer components

	ColdLight Checkbox — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createCheckbox } from "$lib/design/primitives/checkbox/index.js";
import CheckboxRoot from "$lib/design/primitives/checkbox/Checkbox.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { checkboxRecipe } from "./recipe.js";
import type { CheckboxProps } from "./types.js";

let {
	intent = "default",
	size = "md",
	checked = false,
	indeterminate = false,
	disabled = false,
	onCheckedChange,
	children,
	class: className,
	...rest
}: CheckboxProps = $props();

const builder = createCheckbox({
	checked: () => checked,
	indeterminate: () => indeterminate,
	disabled: () => disabled,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onCheckedChange: (v: any) => onCheckedChange?.(v),
});

const classes = $derived(
	cn(checkboxRecipe({ intent, size }), className));
</script>

<CheckboxRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</CheckboxRoot>
