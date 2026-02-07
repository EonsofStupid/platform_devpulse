<!--
	@component AlertDialogTitle
	@description Structural title heading for alert-dialog.
	Contract: kind="alert-dialog", slot="title"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { AlertDialogTitleProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogTitleProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogTitle");
</script>

<h2
	{...rest}
	data-kind="alert-dialog"
	data-slot="title"
	class={cn(className)}
>
	{@render children?.()}
</h2>
