<!--
	@component Spinner
	@kind spinner
	@layer components

	ColdLight Spinner — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createSpinner } from "$lib/design/api/dsadapters/coldlight/_internal/spinner/index.js";
import SpinnerRoot from "$lib/design/primitives/spinner/Spinner.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { spinnerRecipe } from "./recipe.js";
import type { SpinnerProps } from "./types.js";

let {
	size = "md",
	active = true,
	onActiveChange,
	class: className,
	...rest
}: SpinnerProps = $props();

const builder = createSpinner({
	active: () => active,
		onActiveChange: (v: any) => onActiveChange?.(v),
});

const classes = $derived(cn(spinnerRecipe({ size }), className));
</script>

<SpinnerRoot {...builder.root} {...rest} class={classes} />
