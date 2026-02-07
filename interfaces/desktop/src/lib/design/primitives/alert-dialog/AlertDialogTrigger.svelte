<!--
	@component AlertDialogTrigger
	@description Structural trigger button for alert-dialog.
	Contract: kind="alert-dialog", slot="trigger"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { AlertDialogTriggerProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogTriggerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogTrigger");
</script>

<button
	{...rest}
	data-kind="alert-dialog"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
