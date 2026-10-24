<!--
	@component AlertDialog.Action
	@kind alert-dialog
	@slot action
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogActionProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogActionProps = $props();
const ctx = getAlertDialogContext();
</script>

<button {...ctx.hook.action} id={ctx.ids.action} data-kind="alert-dialog" data-slot="action" class={cn(className)} {...rest}>
	{@render children?.()}
</button>
