<!--
	@component ComboboxTrigger
	@description Structural shell for combobox trigger button.
	Contract: kind="combobox", slot="trigger", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ComboboxTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: ComboboxTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ComboboxTrigger");
</script>

<button
	{...rest}
	data-kind="combobox"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
