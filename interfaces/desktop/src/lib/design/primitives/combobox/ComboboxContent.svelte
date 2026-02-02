<!--
	@component ComboboxContent
	@description Structural shell for combobox dropdown content.
	Contract: kind="combobox", slot="content", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ComboboxContentProps } from "./types.js";

	let { children, class: className, ...rest }: ComboboxContentProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ComboboxContent");
</script>

<div
	{...rest}
	data-kind="combobox"
	data-slot="content"
	class={cn(className)}
>
	{@render children?.()}
</div>
