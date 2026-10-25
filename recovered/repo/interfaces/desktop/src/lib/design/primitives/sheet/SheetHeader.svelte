<!--
	@component SheetHeader
	@description Structural header container within sheet content.
	Contract: kind="sheet", slot="header"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SheetHeaderProps } from "./types.js";

let { children, class: className, ...rest }: SheetHeaderProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetHeader");
</script>

<div
	{...rest}
	data-kind="sheet"
	data-slot="header"
	class={cn(className)}
>
	{@render children?.()}
</div>
