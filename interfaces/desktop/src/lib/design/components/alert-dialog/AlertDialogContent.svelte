<!--
	@component AlertDialogContent
	@kind alert-dialog
	@slot content
	@layer components

	Main content area using native <dialog> element with role="alertdialog".
	ColdLight-owned ARIA: role, aria-modal, aria-labelledby, aria-describedby.
	Focus trap active when open. Escape closes.
-->
<script lang="ts">
	import type { AlertDialogContentProps } from "./types.js";
	import { getAlertDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { alertDialogRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: AlertDialogContentProps = $props();
	const ctx = getAlertDialogContext();
	const recipe = alertDialogRecipe();

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === "Escape") {
			e.preventDefault();
			ctx.setOpen(false);
		}
	}
</script>

{#if ctx.open}
	<dialog
		id={ctx.contentId}
		role="alertdialog"
		aria-modal="true"
		aria-labelledby={ctx.titleId}
		aria-describedby={ctx.descriptionId}
		onkeydown={handleKeydown}
		use:ctx.registerContent
		class={cn(recipe.content, className)}
		data-kind="alert-dialog"
		data-slot="content"
		data-state={ctx.open ? "open" : "closed"}
		open
		{...rest}
	>
		{@render children?.()}
	</dialog>
{/if}
