<!--
	@component ComboboxInput
	@description Structural shell for combobox search input.
	Contract: kind="combobox", slot="input", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ComboboxInputProps } from "./types.js";

	let { class: className, ...rest }: ComboboxInputProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ComboboxInput");
</script>

<input
	{...rest}
	data-kind="combobox"
	data-slot="input"
	class={cn(className)}
/>
