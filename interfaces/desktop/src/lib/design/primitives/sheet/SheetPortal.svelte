<!--
	@component SheetPortal
	@description Structural teleport container for sheet.
	Contract: kind="sheet", slot="portal"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SheetPortalProps } from "./types.js";

	let { children, class: className, ...rest }: SheetPortalProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetPortal");
</script>

<div
	{...rest}
	data-kind="sheet"
	data-slot="portal"
	class={cn(className)}
>
	{@render children?.()}
</div>
