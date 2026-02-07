<!--
	@component SheetClose
	@description Structural close button for sheet.
	Contract: kind="sheet", slot="close"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SheetCloseProps } from "./types.js";

let { children, class: className, ...rest }: SheetCloseProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetClose");
</script>

<button
	{...rest}
	data-kind="sheet"
	data-slot="close"
	class={cn(className)}
>
	{@render children?.()}
</button>
