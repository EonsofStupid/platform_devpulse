<!--
	@component Dialog.Overlay
	@kind dialog
	@slot overlay
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogOverlayProps } from "./types.js";

let { children, class: className, ...rest }: DialogOverlayProps = $props();
const ctx = getDialogContext();
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
