<!--
	@component DialogOverlay
	@description Structural backdrop for dialog.
	Contract: kind="dialog", slot="overlay"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DialogOverlayProps } from "./types.js";

	let { children, class: className, ...rest }: DialogOverlayProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogOverlay");
</script>

<div
	{...rest}
	data-kind="dialog"
	data-slot="overlay"
	class={cn(className)}
>
	{@render children?.()}
</div>
