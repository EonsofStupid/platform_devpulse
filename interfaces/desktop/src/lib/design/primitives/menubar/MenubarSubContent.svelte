<!--
	@component MenubarSubContent
	@description Structural dropdown panel for a submenu.
	Contract: kind="menubar", slot="sub-content"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { MenubarSubContentProps } from "./types.js";

	let { children, class: className, ...rest }: MenubarSubContentProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarSubContent");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="sub-content"
	class={cn(className)}
>
	{@render children?.()}
</div>
