<!--
	@component Separator
	@kind separator
	@layer components

	ColdLight Separator — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createSeparator } from "$lib/design/api/dsadapters/coldlight/_internal/separator/index.js";
import SeparatorRoot from "$lib/design/primitives/separator/Separator.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { separatorRecipe } from "./recipe.js";
import type { SeparatorProps } from "./types.js";

let {
	orientation = "horizontal",
	decorative = false,
	variant = "solid",
	class: className,
	...rest
}: SeparatorProps = $props();

const builder = createSeparator({
	orientation: () => orientation,
	decorative: () => decorative,
});

const classes = $derived(
	cn(separatorRecipe({ orientation, variant }), className));
</script>

<SeparatorRoot {...builder.root} {...rest} class={classes} />
