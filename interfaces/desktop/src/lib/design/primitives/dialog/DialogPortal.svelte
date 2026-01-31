<!--
	@component DialogPortal
	@description Structural portal container for dialog.
	Contract: kind="dialog", slot="portal"
	Component layer handles actual teleportation to document.body.
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DialogPortalProps } from "./types.js";

	let { children, class: className, ...rest }: DialogPortalProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogPortal");
</script>

<div
	{...rest}
	data-kind="dialog"
	data-slot="portal"
	class={cn(className)}
>
	{@render children?.()}
</div>
