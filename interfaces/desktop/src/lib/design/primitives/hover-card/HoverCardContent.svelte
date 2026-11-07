<!--
	@component HoverCardContent
	@description Structural shell for hover-card content.
	Contract: kind="hover-card", slot="content", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getHoverCardContext } from "./context.js";
import type { HoverCardContentProps } from "./types.js";

let { children, class: className, ...rest }: HoverCardContentProps = $props();
const ctx = getHoverCardContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "HoverCardContent");
</script>

<div
	{...rest}
	data-kind="hover-card"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
