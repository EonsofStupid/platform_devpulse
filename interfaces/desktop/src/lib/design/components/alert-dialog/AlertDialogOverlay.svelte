<!--
	@component AlertDialogOverlay
	@kind alert-dialog
	@slot overlay
	@layer components

	Backdrop overlay rendered when alert dialog is open.
	ColdLight-owned: aria-hidden="true".
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getAlertDialogContext } from "./context.js";
import { alertDialogRecipe } from "./recipe.js";
import type { AlertDialogOverlayProps } from "./types.js";

let { class: className, ...rest }: AlertDialogOverlayProps = $props();
const ctx = getAlertDialogContext();
const recipe = alertDialogRecipe();
</script>

{#if ctx.open}
	<div
		aria-hidden="true"
		class={cn(recipe.overlay, className)}
		data-kind="alert-dialog"
		data-slot="overlay"
		data-state={ctx.open ? "open" : "closed"}
		{...rest}
	></div>
{/if}
