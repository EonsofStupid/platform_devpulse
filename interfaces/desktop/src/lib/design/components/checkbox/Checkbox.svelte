<!--
	@component Checkbox
	@kind checkbox
	@layer components

	ColdLight Checkbox — wraps structureless CheckboxRoot with:
	- ARIA attributes (role="checkbox", aria-checked, aria-disabled)
	- State derivation (data-state)
	- SD5 token-driven recipe (intent x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Checkbox Pattern
-->
<script lang="ts">
	import type { CheckboxComponentProps } from "./types.js";
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

	const classes = $derived(cn(checkboxRecipe({ intent, size }), className));

	const ariaChecked = $derived(
		checked ? "true" : indeterminate ? "mixed" : "false",
	);

	const dataState = $derived(
		disabled
			? "disabled"
			: checked
				? "checked"
				: indeterminate
					? "indeterminate"
					: "unchecked",
	);

	function handleClick(e: MouseEvent) {
		if (disabled) return;
		onCheckedChange?.(!checked);
		rest.onclick?.(e as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
	}
</script>

<CheckboxRoot
	{...rest}
	class={classes}
	{disabled}
	role="checkbox"
	aria-checked={ariaChecked}
	aria-disabled={disabled || undefined}
	data-state={dataState}
	onclick={handleClick}
>
	{@render children?.()}
</CheckboxRoot>
