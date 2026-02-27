<!--
	@component Divider
	@kind divider
	@layer components

	ColdLight Divider — wraps structureless DividerRoot with:
	- ARIA attributes (role="separator" or role="none" for decorative)
	- Builder-driven attribute binding with orientation support
	- SD5 token-driven recipe (orientation x variant)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Alias for separator with identical ARIA behavior.
-->
<script lang="ts">
	import type { DividerComponentProps } from "./types.js";
	import { createDivider } from "$lib/design/api/adapters/coldlight/_internal/divider/index.js";
	import DividerRoot from "$lib/design/primitives/divider/Divider.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { dividerRecipe } from "./recipe.js";

	let {
		orientation = "horizontal",
		variant = "solid",
		decorative = false,
		class: className,
		...rest
	}: DividerComponentProps = $props();

	const builder = createDivider({
		get orientation() { return orientation; },
		get decorative() { return decorative; },
	});

	const classes = $derived(cn(dividerRecipe({ orientation, variant }), className));
</script>

<DividerRoot {...builder.root} {...rest} class={classes} />
