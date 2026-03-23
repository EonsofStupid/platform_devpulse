<!--
	@component Prose
	@kind prose
	@layer components

	ColdLight Prose — builder-driven rich text content container.
	Builder provides data attributes. Component adds recipe classes (prose typography).
-->
<script lang="ts">
import { createProse } from "$lib/design/api/dsadapters/coldlight/_internal/prose/index.js";
import ProseRoot from "$lib/design/primitives/prose/Prose.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { proseRecipe } from "./recipe.js";
import type { ProseComponentProps } from "./types.js";

let {
	size = "base",
	children,
	class: className,
	...rest
}: ProseComponentProps = $props();

const builder = createProse();

const classes = $derived(cn(proseRecipe({ size }), className));
</script>

<ProseRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</ProseRoot>
