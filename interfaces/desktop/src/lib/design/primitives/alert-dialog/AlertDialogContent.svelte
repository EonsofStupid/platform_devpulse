<!--
	@component AlertDialogContent
	@description Structural content panel for alert-dialog.
	Contract: kind="alert-dialog", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogContentProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogContentProps = $props();

const ctx = getAlertDialogContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogContent");
</script>

<div
	{...rest}
	data-kind="alert-dialog"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
