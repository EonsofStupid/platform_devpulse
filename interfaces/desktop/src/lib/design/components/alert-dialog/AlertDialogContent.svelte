<!--
	@component AlertDialog.Content
	@kind alert-dialog
	@slot content
	@layer components
-->
<script lang="ts">
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogContentProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogContentProps = $props();
const ctx = getAlertDialogContext();

const m = $derived(resolveMacro({ kind: "alert-dialog", preset: "default" }));
</script>

{#if ctx.hook.open}
	<dialog
		{...ctx.hook.content}
		use:ctx.hook.attachContent
		id={ctx.ids.content}
		{...m.dataAttrs}
		data-slot="content"
		style={cssVarString(m.cssVars)}
		class={cn(className)}
		{...rest}
		open
	>
		{@render children?.()}
	</dialog>
{/if}
