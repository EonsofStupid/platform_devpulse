<!--
	@component AlertDialog.Action
	@kind alert-dialog
	@slot action
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogActionProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogActionProps = $props();
const ctx = getAlertDialogContext();
</script>

<button {...ctx.hook.action} id={ctx.ids.action} class={cn(ctx.classes.action, className)} {...rest}>
	{@render children?.()}
</button>
