<!--
	@component DialogContent
	@description Structural content panel for dialog.
	Contract: kind="dialog", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getDialogContext } from "./context.js";
import type { DialogContentProps } from "./types.js";

let { children, class: className, ...rest }: DialogContentProps = $props();

const ctx = getDialogContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogContent");
</script>

<div
	{...rest}
	data-kind="dialog"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
