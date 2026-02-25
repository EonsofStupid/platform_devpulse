<!--
	@component Switch
	@kind switch
	@layer components

	ColdLight Switch — wraps structureless SwitchRoot with:
	- ARIA attributes (role="switch", aria-checked, aria-disabled)
	- State derivation (data-state)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Switch Pattern
-->
<script lang="ts">
	import type { SwitchComponentProps } from "./types.js";
	import SwitchRoot from "$lib/design/primitives/switch/Switch.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { switchRecipe, switchThumbRecipe } from "./recipe.js";

	let {
		size = "md",
		checked = false,
		disabled = false,
		onCheckedChange,
		children,
		class: className,
		...rest
	}: SwitchComponentProps = $props();

	const classes = $derived(cn(switchRecipe({ size }), className));
	const thumbClasses = $derived(switchThumbRecipe({ size, checked }));

	const dataState = $derived(
		disabled
			? "disabled"
			: checked
				? "checked"
				: "unchecked",
	);

	function handleClick(e: MouseEvent) {
		if (disabled) return;
		onCheckedChange?.(!checked);
		rest.onclick?.(e as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
	}
</script>

<SwitchRoot
	{...rest}
	class={classes}
	{disabled}
	role="switch"
	aria-checked={checked ? "true" : "false"}
	aria-disabled={disabled || undefined}
	data-state={dataState}
	onclick={handleClick}
>
	<span class={thumbClasses} aria-hidden="true" data-slot="thumb"></span>
	{@render children?.()}
</SwitchRoot>
