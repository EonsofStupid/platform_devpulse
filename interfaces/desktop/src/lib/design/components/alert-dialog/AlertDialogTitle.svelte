<!--
	@component AlertDialogTitle
	@kind alert-dialog
	@slot title
	@layer components

	Title element with ID for aria-labelledby linking.
	ColdLight-owned ARIA.
-->
<script lang="ts">
	import type { AlertDialogTitleProps } from "./types.js";
	import { getAlertDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { alertDialogRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: AlertDialogTitleProps = $props();
	const ctx = getAlertDialogContext();
	const recipe = alertDialogRecipe();
</script>

<h2
	id={ctx.titleId}
	class={cn(recipe.title, className)}
	data-kind="alert-dialog"
	data-slot="title"
	{...rest}
>
	{@render children?.()}
</h2>
