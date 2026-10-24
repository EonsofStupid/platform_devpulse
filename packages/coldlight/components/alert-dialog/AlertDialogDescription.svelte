<!--
	@component AlertDialog.Description
	@kind alert-dialog
	@slot description
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogDescriptionProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogDescriptionProps = $props();
const ctx = getAlertDialogContext();
</script>

<p {...ctx.hook.description} id={ctx.ids.description ?? ctx.hook.description.id} data-kind="alert-dialog" data-slot="description" class={cn(className)} {...rest}>
	{@render children?.()}
</p>
