<!--
	@component AlertDialog.Cancel
	@kind alert-dialog
	@slot cancel
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogCancelProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogCancelProps = $props();
const ctx = getAlertDialogContext();
</script>

<button {...ctx.hook.cancel} id={ctx.ids.cancel} data-kind="alert-dialog" data-slot="cancel" class={cn(className)} {...rest}>
	{@render children?.()}
</button>
