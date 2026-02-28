<!--
	@component AlertDialogAction
	@kind alert-dialog
	@slot action
	@layer components

	Destructive/confirm action button.
	Clicking confirms and closes the alert dialog.
	ColdLight-owned ARIA.
-->
<script lang="ts">
	import type { AlertDialogActionProps } from "./types.js";
	import { getAlertDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { alertDialogRecipe } from "./recipe.js";

	let { children, class: className, onclick, ...rest }: AlertDialogActionProps = $props();
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
	class={cn(recipe.action, className)}
	data-kind="alert-dialog"
	data-slot="action"
	{...rest}
>
	{@render children?.()}
</button>
