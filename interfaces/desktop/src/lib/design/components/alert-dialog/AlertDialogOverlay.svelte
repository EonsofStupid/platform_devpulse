<!--
	@component AlertDialog.Overlay
	@kind alert-dialog
	@slot overlay
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogOverlayProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogOverlayProps = $props();
const ctx = getAlertDialogContext();
</script>

{#if ctx.hook.open}
	<div
		{...ctx.hook.overlay}
		use:ctx.hook.attachOverlay
		id={ctx.ids.overlay}
		class={cn(ctx.classes.overlay, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
