<!--
	@component AlertDialog.Trigger
	@kind alert-dialog
	@slot trigger
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogTriggerProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogTriggerProps = $props();
const ctx = getAlertDialogContext();
</script>

<button {...ctx.hook.trigger} id={ctx.ids.trigger} data-kind="alert-dialog" data-slot="trigger" class={cn(className)}>
	{@render children?.()}
</button>
