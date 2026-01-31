<!--
	@component DialogTrigger
	@description Structural trigger button for dialog.
	Contract: kind="dialog", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DialogTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: DialogTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogTrigger");
</script>

<button
	{...rest}
	data-kind="dialog"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
