<!--
	@component DialogClose
	@description Structural close button for dialog.
	Contract: kind="dialog", slot="close"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DialogCloseProps } from "./types.js";

let { children, class: className, ...rest }: DialogCloseProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogClose");
</script>

<button
	{...rest}
	data-kind="dialog"
	data-slot="close"
	class={cn(className)}
>
	{@render children?.()}
</button>
