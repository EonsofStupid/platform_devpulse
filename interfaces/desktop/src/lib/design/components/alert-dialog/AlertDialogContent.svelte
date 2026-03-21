<!--
	@component AlertDialog.Content
	@kind alert-dialog
	@slot content
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogContentProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogContentProps = $props();
const ctx = getAlertDialogContext();
</script>

{#if ctx.hook.open}
	<dialog
		{...ctx.hook.content}
		use:ctx.hook.attachContent
		id={ctx.ids.content}
		class={cn(ctx.classes.content, className)}
		{...rest}
		open
	>
		{@render children?.()}
	</dialog>
{/if}
