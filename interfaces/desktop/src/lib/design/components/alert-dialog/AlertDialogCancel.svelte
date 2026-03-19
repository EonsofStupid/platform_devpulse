<!--
	@component AlertDialogCancel
	@kind alert-dialog
	@slot cancel
	@layer components

	Cancel button — receives initial focus when dialog opens (APG safety pattern).
	Clicking cancels and closes the alert dialog.
	ColdLight-owned ARIA.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import { alertDialogRecipe } from "./recipe.js";
import type { AlertDialogCancelProps } from "./types.js";

let { children, class: className, onclick, ...rest }: AlertDialogCancelProps = $props();
const ctx = getAlertDialogContext();
const recipe = alertDialogRecipe();

function handleClick(e: MouseEvent & { currentTarget: HTMLButtonElement }): void {
	if (typeof onclick === "function") {
		onclick(e as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
	}
	ctx.setOpen(false);
}
</script>

<button
	type="button"
	onclick={handleClick}
	use:ctx.registerCancel
	class={cn(recipe.cancel, className)}
	data-kind="alert-dialog"
	data-slot="cancel"
	{...rest}
>
	{@render children?.()}
</button>
