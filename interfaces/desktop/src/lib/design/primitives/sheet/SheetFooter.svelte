<!--
	@component SheetFooter
	@description Structural footer container within sheet content.
	Contract: kind="sheet", slot="footer"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SheetFooterProps } from "./types.js";

	let { children, class: className, ...rest }: SheetFooterProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetFooter");
</script>

<div
	{...rest}
	data-kind="sheet"
	data-slot="footer"
	class={cn(className)}
>
	{@render children?.()}
</div>
