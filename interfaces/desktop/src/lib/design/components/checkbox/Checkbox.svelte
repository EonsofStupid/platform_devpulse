<!--
	@component Checkbox
	@kind checkbox
	@layer components

	ColdLight Checkbox — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
	Reference: WAI-ARIA APG Checkbox Pattern
-->
<script lang="ts">
	import type { CheckboxComponentProps } from "./types.js";
	import { createCheckbox } from "$lib/design/api/adapters/coldlight/_internal/checkbox/index.js";
	import CheckboxRoot from "$lib/design/primitives/checkbox/Checkbox.svelte";
	import { cn } from "$lib/design/primitives/types.js";
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
		...rest
	}: CheckboxComponentProps = $props();

	const builder = createCheckbox({
		checked: () => checked,
		indeterminate: () => indeterminate,
		disabled: () => disabled,
		onCheckedChange,
	});

	const classes = $derived(cn(checkboxRecipe({ intent, size }), className));
</script>

<CheckboxRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</CheckboxRoot>
