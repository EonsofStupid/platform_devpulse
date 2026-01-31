<!--
	@component DialogDescription
	@description Structural description text for dialog.
	Contract: kind="dialog", slot="description"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DialogDescriptionProps } from "./types.js";

	let { children, class: className, ...rest }: DialogDescriptionProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogDescription");
</script>

<p
	{...rest}
	data-kind="dialog"
	data-slot="description"
	class={cn(className)}
>
	{@render children?.()}
</p>
