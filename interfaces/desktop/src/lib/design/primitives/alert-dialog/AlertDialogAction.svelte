<!--
	@component AlertDialogAction
	@description Structural confirm action button for alert-dialog.
	Contract: kind="alert-dialog", slot="action"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AlertDialogActionProps } from "./types.js";

	let { children, class: className, ...rest }: AlertDialogActionProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogAction");
</script>

<button
	{...rest}
	data-kind="alert-dialog"
	data-slot="action"
	class={cn(className)}
>
	{@render children?.()}
</button>
