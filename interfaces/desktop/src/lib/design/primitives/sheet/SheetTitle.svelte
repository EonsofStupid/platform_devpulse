<!--
	@component SheetTitle
	@description Structural title heading for sheet.
	Contract: kind="sheet", slot="title"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SheetTitleProps } from "./types.js";

let { children, class: className, ...rest }: SheetTitleProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetTitle");
</script>

<h2
	{...rest}
	data-kind="sheet"
	data-slot="title"
	class={cn(className)}
>
	{@render children?.()}
</h2>
