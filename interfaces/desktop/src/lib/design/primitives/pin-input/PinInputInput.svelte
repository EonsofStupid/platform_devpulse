<!--
	@component PinInputInput
	@description Structural shell for pin-input individual character input.
	Contract: kind="pin-input", slot="input", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PinInputInputProps } from "./types.js";

	let { class: className, ...rest }: PinInputInputProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PinInputInput");
</script>

<input
	{...rest}
	data-kind="pin-input"
	data-slot="input"
	class={cn(className)}
/>
