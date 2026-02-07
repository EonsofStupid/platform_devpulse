<!--
	@component SheetTrigger
	@description Structural trigger button for sheet.
	Contract: kind="sheet", slot="trigger"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SheetTriggerProps } from "./types.js";

let { children, class: className, ...rest }: SheetTriggerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetTrigger");
</script>

<button
	{...rest}
	data-kind="sheet"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
