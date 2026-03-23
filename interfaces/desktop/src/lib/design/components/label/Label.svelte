<!--
	@component Label
	@kind label
	@layer components

	ColdLight Label — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createLabel } from "$lib/design/api/dsadapters/coldlight/_internal/label/index.js";
import LabelRoot from "$lib/design/primitives/label/Label.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { labelRecipe } from "./recipe.js";
import type { LabelProps } from "./types.js";

let {
	size = "md",
	htmlFor,
	disabled = false,
	required = false,
	children,
	class: className,
	...rest
}: LabelProps = $props();

const builder = createLabel({
	htmlFor: () => htmlFor,
	disabled: () => disabled,
});

const classes = $derived(cn(labelRecipe({ size }), className));
</script>

<LabelRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
	{#if required}<span aria-hidden="true">*</span>{/if}
</LabelRoot>
