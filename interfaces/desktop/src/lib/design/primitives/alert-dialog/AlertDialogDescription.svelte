<!--
	@component AlertDialogDescription
	@description Structural description text for alert-dialog.
	Contract: kind="alert-dialog", slot="description"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AlertDialogDescriptionProps } from "./types.js";

	let { children, class: className, ...rest }: AlertDialogDescriptionProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDialogDescription");
</script>

<p
	{...rest}
	data-kind="alert-dialog"
	data-slot="description"
	class={cn(className)}
>
	{@render children?.()}
</p>
