<!--
	@component SheetOverlay
	@description Structural backdrop overlay for sheet.
	Contract: kind="sheet", slot="overlay"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SheetOverlayProps } from "./types.js";

let { children, class: className, ...rest }: SheetOverlayProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SheetOverlay");
</script>

<div
	{...rest}
	data-kind="sheet"
	data-slot="overlay"
	class={cn(className)}
>
	{@render children?.()}
</div>
