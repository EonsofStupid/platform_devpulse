<!--
	@component AlertDialogDescription
	@kind alert-dialog
	@slot description
	@layer components

	Description paragraph with ID for aria-describedby linking.
	ColdLight-owned ARIA.
-->
<script lang="ts">
	import type { AlertDialogDescriptionProps } from "./types.js";
	import { getAlertDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { alertDialogRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: AlertDialogDescriptionProps = $props();
	const ctx = getAlertDialogContext();
	const recipe = alertDialogRecipe();
</script>

<p
	id={ctx.descriptionId}
	class={cn(recipe.description, className)}
	data-kind="alert-dialog"
	data-slot="description"
	{...rest}
>
	{@render children?.()}
</p>
