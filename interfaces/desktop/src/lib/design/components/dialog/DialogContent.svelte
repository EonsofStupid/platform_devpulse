<!--
	@component DialogContent
	@kind dialog
	@slot content
	@layer components

	Main content area using native <dialog> element.
	Spreads adapter content slot attrs (role, aria-modal, aria-labelledby, aria-describedby).
	Uses attachContent Svelte action for showModal, scroll lock, dismiss layer, presence, focus restore.
-->
<script lang="ts">
	import type { DialogContentProps } from "./types.js";
	import { getDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let { children, class: className, ...rest }: DialogContentProps = $props();
	const dialog = getDialogContext();
	const recipe = getRecipe("dialog.glass.void");
	const contentClass = recipe?.classes({} as any)?.content ?? "";
</script>

{#if dialog.open}
	<dialog
		{...dialog.content}
		use:dialog.attachContent
		class={cn(contentClass, className)}
		data-kind="dialog"
		data-slot="content"
		data-state={dialog.open ? "open" : "closed"}
		{...rest}
		open
	>
		{@render children?.()}
	</dialog>
{/if}
