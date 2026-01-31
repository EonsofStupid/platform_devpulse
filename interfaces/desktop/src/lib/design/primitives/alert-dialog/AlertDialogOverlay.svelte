<!--
	@component AlertDialogOverlay
	@description Structural backdrop overlay for alert-dialog.
	Contract: kind="alert-dialog", slot="overlay"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AlertDialogOverlayProps } from "./types.js";

	let { children, class: className, ...rest }: AlertDialogOverlayProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogOverlay");
</script>

<div
	{...rest}
	data-kind="alert-dialog"
	data-slot="overlay"
	class={cn(className)}
>
	{@render children?.()}
</div>
