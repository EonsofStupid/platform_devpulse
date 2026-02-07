<!--
	@component CollapsibleContent
	@description Structural expandable content for collapsible.
	Contract: kind="collapsible", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getCollapsibleContext } from "./context.js";
import type { CollapsibleContentProps } from "./types.js";

let { children, class: className, ...rest }: CollapsibleContentProps = $props();
const ctx = getCollapsibleContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CollapsibleContent");
</script>

<div
	{...rest}
	data-kind="collapsible"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
