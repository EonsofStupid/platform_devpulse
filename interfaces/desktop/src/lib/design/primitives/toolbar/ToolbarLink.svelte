<!--
	@component ToolbarLink
	@description Structural link element within a toolbar.
	Contract: kind="toolbar", slot="link"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ToolbarLinkProps } from "./types.js";

let { children, class: className, ...rest }: ToolbarLinkProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ToolbarLink");
</script>

<a
	{...rest}
	data-kind="toolbar"
	data-slot="link"
	class={cn(className)}
>
	{@render children?.()}
</a>
