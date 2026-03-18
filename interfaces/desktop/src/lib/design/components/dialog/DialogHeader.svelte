<!--
	@component DialogHeader
	@kind dialog
	@slot header
	@layer components

	Header section wrapper for dialog title and description.
	Applies recipe header classes.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DialogHeaderProps } from "./types.js";

let { children, class: className, ...rest }: DialogHeaderProps = $props();
const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const headerClass = recipe?.classes?.({} as any)?.header ?? "";
</script>

<div
	class={cn(headerClass, className)}
	data-kind="dialog"
	data-slot="header"
	{...rest}
>
	{@render children?.()}
</div>
