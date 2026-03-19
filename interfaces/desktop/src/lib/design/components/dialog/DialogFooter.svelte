<!--
	@component DialogFooter
	@kind dialog
	@slot footer
	@layer components

	Footer section wrapper for dialog actions.
	Applies recipe footer classes.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DialogFooterProps } from "./types.js";

let { children, class: className, ...rest }: DialogFooterProps = $props();
const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const footerClass = recipe?.classes?.({} as any)?.footer ?? "";
</script>

<div
	class={cn(footerClass, className)}
	data-kind="dialog"
	data-slot="footer"
	{...rest}
>
	{@render children?.()}
</div>
