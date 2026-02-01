<!--
	@component Badge
	@description Structural shell for badge primitive.
	Contract: kind="badge", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { BadgeProps } from "./types.js";

	let { children, class: className, ...rest }: BadgeProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Badge");
</script>

<span
	{...rest}
	data-kind="badge"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</span>
