<!--
	@component List
	@kind list
	@layer components

	ColdLight List — wraps structureless ListRoot with:
	- ARIA attributes (role="list", aria-label)
	- Builder-driven attribute binding
	- SD5 token-driven recipe (variant x size x spacing)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
import { createList } from "$lib/design/api/dsadapters/coldlight/_internal/list/index.js";
import ListRoot from "$lib/design/primitives/list/List.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { listRecipe } from "./recipe.js";
import type { ListComponentProps } from "./types.js";

let {
	size = "md",
	variant = "none",
	spacing = "default",
	label,
	children,
	class: className,
	...rest
}: ListComponentProps = $props();

const builder = createList({
	get label() {
		return label;
	},
});

const classes = $derived(
	cn(listRecipe({ size, variant, spacing }), className));
</script>

<ListRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</ListRoot>
