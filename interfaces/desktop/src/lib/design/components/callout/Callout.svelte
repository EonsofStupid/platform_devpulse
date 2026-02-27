<!--
	@component Callout
	@kind callout
	@layer components

	ColdLight Callout — wraps structureless Callout primitive with:
	- ARIA attributes (role="note")
	- Data-state derivation (variant-driven)
	- SD5 token-driven recipe (variant)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { CalloutComponentProps } from "./types.js";
	import { createCallout } from "$lib/design/api/adapters/coldlight/_internal/callout/index.js";
	import CalloutRoot from "$lib/design/primitives/callout/Callout.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { calloutRecipe } from "./recipe.js";

	let {
		variant = "info",
		children,
		class: className,
		...rest
	}: CalloutComponentProps = $props();

	const builder = createCallout();

	const classes = $derived(cn(calloutRecipe({ variant }), className));
</script>

<CalloutRoot {...builder.root} {...rest} class={classes} data-state={variant}>
	{@render children?.()}
</CalloutRoot>
