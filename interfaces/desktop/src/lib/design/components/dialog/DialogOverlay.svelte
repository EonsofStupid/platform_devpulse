<!--
	@component DialogOverlay
	@kind dialog
	@slot overlay
	@layer components

	Backdrop overlay rendered conditionally when dialog is open.
	Spreads adapter overlay slot attrs (aria-hidden, popover).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { getDialogContext } from "./context.js";
import type { DialogOverlayProps } from "./types.js";

let { class: className, ...rest }: DialogOverlayProps = $props();
const dialog = getDialogContext();
const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const overlayClass = recipe?.classes?.({} as any)?.overlay ?? "";
</script>

{#if dialog.open}
	<div
		{...dialog.overlay}
		use:dialog.attachOverlay
		class={cn(overlayClass, className)}
		data-kind="dialog"
		data-slot="overlay"
		data-state={dialog.open ? "open" : "closed"}
		{...rest}
	></div>
{/if}
