<!--
	@component DialogTitle
	@kind dialog
	@slot title
	@layer components

	Title element with aria linking via adapter-generated ID.
	Spreads adapter title slot attrs ({ id }).
-->
<script lang="ts">
	import type { DialogTitleProps } from "./types.js";
	import { getDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let { children, class: className, ...rest }: DialogTitleProps = $props();
	const dialog = getDialogContext();
	const recipe = getRecipe("dialog.glass.void");
	const titleClass = recipe?.classes?.({} as any)?.title ?? "";
</script>

<h2
	{...dialog.title}
	class={cn(titleClass, className)}
	data-kind="dialog"
	data-slot="title"
	{...rest}
>
	{@render children?.()}
</h2>
