<!--
	@component SheetContent
	@description Structural content panel for sheet.
	Contract: kind="sheet", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getSheetContext } from "./context.js";
import type { SheetContentProps } from "./types.js";

let { children, class: className, ...rest }: SheetContentProps = $props();

const ctx = getSheetContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetContent");
</script>

<div
	{...rest}
	data-kind="sheet"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
