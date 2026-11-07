<!--
	@component MenubarSeparator
	@description Structural visual divider between menu sections.
	Contract: kind="menubar", slot="separator"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { MenubarSeparatorProps } from "./types.js";

let { children, class: className, ...rest }: MenubarSeparatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarSeparator");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="separator"
	class={cn(className)}
>
	{@render children?.()}
</div>
