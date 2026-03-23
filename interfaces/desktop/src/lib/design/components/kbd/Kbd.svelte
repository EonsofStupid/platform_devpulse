<!--
	@component Kbd
	@kind kbd
	@layer components

	ColdLight Kbd — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createKbd } from "$lib/design/api/dsadapters/coldlight/_internal/kbd/index.js";
import KbdRoot from "$lib/design/primitives/kbd/Kbd.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { kbdRecipe } from "./recipe.js";
import type { KbdProps } from "./types.js";

let {
	size = "md",
	children,
	class: className,
	...rest
}: KbdProps = $props();

const builder = createKbd();

const classes = $derived(cn(kbdRecipe({ size }), className));
</script>

<KbdRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</KbdRoot>
