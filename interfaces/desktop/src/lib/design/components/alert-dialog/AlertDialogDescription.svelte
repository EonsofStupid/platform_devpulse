<!--
	@component AlertDialogDescription
	@kind alert-dialog
	@slot description
	@layer components

	Description paragraph with ID for aria-describedby linking.
	ColdLight-owned ARIA.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import { alertDialogRecipe } from "./recipe.js";
import type { AlertDialogDescriptionProps } from "./types.js";

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
