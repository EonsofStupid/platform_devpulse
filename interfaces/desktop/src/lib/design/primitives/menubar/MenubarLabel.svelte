<!--
	@component MenubarLabel
	@description Structural non-interactive label for a menu group.
	Contract: kind="menubar", slot="label"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { MenubarLabelProps } from "./types.js";

	let { children, class: className, ...rest }: MenubarLabelProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarLabel");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="label"
	class={cn(className)}
>
	{@render children?.()}
</div>
