<!--
	@component PinInput
	@description Structural shell for pin-input primitive.
	Contract: kind="pin-input", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { PinInputProps } from "./types.js";

let { children, class: className, ...rest }: PinInputProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PinInput");
</script>

<div
	{...rest}
	data-kind="pin-input"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
