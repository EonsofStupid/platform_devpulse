<!--
	@component AlertDialog.Title
	@kind alert-dialog
	@slot title
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogTitleProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogTitleProps = $props();
const ctx = getAlertDialogContext();
</script>

<h2 {...ctx.hook.title} id={ctx.ids.title ?? ctx.hook.title.id} data-kind="alert-dialog" data-slot="title" class={cn(className)} {...rest}>
	{@render children?.()}
</h2>
