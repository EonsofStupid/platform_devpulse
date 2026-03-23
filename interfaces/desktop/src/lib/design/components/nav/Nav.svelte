<!--
	@component Nav
	@kind nav
	@layer components

	ColdLight Nav — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. StyleMacro provides visual styling.
-->
<script lang="ts">
import { createNav } from "$lib/design/api/dsadapters/coldlight/_internal/nav/index.js";
import NavRoot from "$lib/design/primitives/nav/Nav.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { navRecipe } from "./recipe.js";
import type { NavComponentProps } from "./types.js";

let {
	// Kind-specific props
	label,
	size = "md",
	orientation = "horizontal",
	children,
	class: className,
	...rest
}: NavComponentProps = $props();

const builder = createNav({ label: () => label });

const classes = $derived(
	cn(navRecipe({ size, orientation }), className));
</script>

<NavRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</NavRoot>
