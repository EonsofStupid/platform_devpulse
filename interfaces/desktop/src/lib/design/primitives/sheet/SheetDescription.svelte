<!--
	@component SheetDescription
	@description Structural description text for sheet.
	Contract: kind="sheet", slot="description"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SheetDescriptionProps } from "./types.js";

	let { children, class: className, ...rest }: SheetDescriptionProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetDescription");
</script>

<p
	{...rest}
	data-kind="sheet"
	data-slot="description"
	class={cn(className)}
>
	{@render children?.()}
</p>
