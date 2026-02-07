<!--
	@component AlertDialogCancel
	@description Structural cancel button for alert-dialog.
	Contract: kind="alert-dialog", slot="cancel"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { AlertDialogCancelProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogCancelProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogCancel");
</script>

<button
	{...rest}
	data-kind="alert-dialog"
	data-slot="cancel"
	class={cn(className)}
>
	{@render children?.()}
</button>
