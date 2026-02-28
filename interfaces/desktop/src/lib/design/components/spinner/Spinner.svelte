<!--
	@component Spinner
	@kind spinner
	@layer components

	ColdLight Spinner — wraps structureless Spinner primitive with:
	- ARIA attributes (role="status", aria-label="Loading", aria-hidden)
	- State derivation (data-state: active/inactive)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { SpinnerComponentProps } from "./types.js";
	import { createSpinner } from "$lib/design/api/adapters/coldlight/_internal/spinner/index.js";
	import SpinnerRoot from "$lib/design/primitives/spinner/Spinner.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { spinnerRecipe } from "./recipe.js";

	let {
		size = "md",
		active = true,
		onActiveChange,
		class: className,
		...rest
	}: SpinnerComponentProps = $props();

	const builder = createSpinner({
		active: () => active,
		onActiveChange: (v: boolean) => onActiveChange?.(v),
	});

	const classes = $derived(cn(spinnerRecipe({ size }), className));
</script>

<SpinnerRoot {...builder.root} {...rest} class={classes} />
