<!--
	@component MenubarSeparator
	@kind menubar
	@slot separator
	@layer components

	Visual and semantic separator between menubar menu items.
	ARIA: role="separator".
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { menubarRecipe } from "./recipe.js";
import type { MenubarSeparatorProps } from "./types.js";

let { class: className, ...rest }: MenubarSeparatorProps = $props();

const recipe = menubarRecipe();
</script>

<div
	role="separator"
	class={cn(recipe.separator, className)}
	data-kind="menubar"
	data-slot="separator"
	{...rest}
></div>
