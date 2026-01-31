<!--
	@component AlertDialogPortal
	@description Structural teleport container for alert-dialog.
	Contract: kind="alert-dialog", slot="portal"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AlertDialogPortalProps } from "./types.js";

	let { children, class: className, ...rest }: AlertDialogPortalProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogPortal");
</script>

<div
	{...rest}
	data-kind="alert-dialog"
	data-slot="portal"
	class={cn(className)}
>
	{@render children?.()}
</div>
