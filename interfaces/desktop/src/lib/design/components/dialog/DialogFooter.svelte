<!--
	@component DialogFooter
	@kind dialog
	@slot footer
	@layer components

	Footer section wrapper for dialog actions.
	Applies recipe footer classes.
-->
<script lang="ts">
	import type { DialogFooterProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let { children, class: className, ...rest }: DialogFooterProps = $props();
	const recipe = getRecipe("dialog.glass.void");
	const footerClass = recipe?.classes({} as any)?.footer ?? "";
</script>

<div
	class={cn(footerClass, className)}
	data-kind="dialog"
	data-slot="footer"
	{...rest}
>
	{@render children?.()}
</div>
