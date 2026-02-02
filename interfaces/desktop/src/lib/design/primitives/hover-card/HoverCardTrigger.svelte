<!--
	@component HoverCardTrigger
	@description Structural shell for hover-card trigger.
	Contract: kind="hover-card", slot="trigger", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { HoverCardTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: HoverCardTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "HoverCardTrigger");
</script>

<a
	{...rest}
	data-kind="hover-card"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</a>
