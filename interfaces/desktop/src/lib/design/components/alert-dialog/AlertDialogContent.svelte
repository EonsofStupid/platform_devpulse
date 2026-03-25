<!--
	@component AlertDialog.Content
	@kind alert-dialog
	@slot content
	@layer components
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogContentProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogContentProps = $props();
const ctx = getAlertDialogContext();
</script>

{#if ctx.hook.open}
	<StyleMacro kind="alert-dialog" style="alert-dialog-default">
		<dialog
			{...ctx.hook.content}
			use:ctx.hook.attachContent
			id={ctx.ids.content}
			data-kind="alert-dialog"
			data-slot="content"
			class={cn(className)}
			{...rest}
			open
		>
			{@render children?.()}
		</dialog>
	</StyleMacro>
{/if}
