<!--
	@component Button
	@kind button
	@layer components

	ColdLight Button — wraps structureless ButtonRoot with:
	- ARIA attributes (aria-pressed, aria-disabled, aria-busy)
	- State derivation (data-state)
	- SD5 token-driven recipe (intent × size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Button Pattern
-->
<script lang="ts">
	import type { ButtonComponentProps } from "./types.js";
	import ButtonRoot from "$lib/design/primitives/button/Button.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { buttonRecipe } from "./recipe.js";

	let {
		intent = "primary",
		size = "md",
		pressed,
		loading = false,
		disabled = false,
		children,
		class: className,
		...rest
	}: ButtonComponentProps = $props();

	const classes = $derived(cn(buttonRecipe({ intent, size }), className));

	const dataState = $derived(
		disabled
			? "disabled"
			: loading
				? "loading"
				: pressed !== undefined
					? pressed
						? "pressed"
						: "idle"
					: undefined,
	);
</script>

<ButtonRoot
	{...rest}
	class={classes}
	{disabled}
	aria-pressed={pressed}
	aria-disabled={disabled || undefined}
	aria-busy={loading || undefined}
	data-state={dataState}
>
	{@render children?.()}
</ButtonRoot>
