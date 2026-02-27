<!--
	@component Separator
	@kind separator
	@layer components

	ColdLight Separator — wraps structureless SeparatorRoot with:
	- ARIA attributes (role="separator" or role="none" for decorative)
	- Builder-driven attribute binding with orientation support
	- SD5 token-driven recipe (orientation x variant)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA separator role
-->
<script lang="ts">
	import type { SeparatorComponentProps } from "./types.js";
	import { createSeparator } from "$lib/design/api/adapters/coldlight/_internal/separator/index.js";
	import SeparatorRoot from "$lib/design/primitives/separator/Separator.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { separatorRecipe } from "./recipe.js";

	let {
		orientation = "horizontal",
		variant = "solid",
		decorative = false,
		class: className,
		...rest
	}: SeparatorComponentProps = $props();

	const builder = createSeparator({
		get orientation() { return orientation; },
		get decorative() { return decorative; },
	});

	const classes = $derived(cn(separatorRecipe({ orientation, variant }), className));
</script>

<SeparatorRoot {...builder.root} {...rest} class={classes} />
