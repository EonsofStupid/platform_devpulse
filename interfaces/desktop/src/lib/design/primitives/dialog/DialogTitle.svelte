<!--
	@component DialogTitle
	@description Structural title heading for dialog.
	Contract: kind="dialog", slot="title"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DialogTitleProps } from "./types.js";

let { children, class: className, ...rest }: DialogTitleProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogTitle");
</script>

<h2
	{...rest}
	data-kind="dialog"
	data-slot="title"
	class={cn(className)}
>
	{@render children?.()}
</h2>
