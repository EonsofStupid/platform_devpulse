<!--
	@component SelectValue
	@description Structural value display for select.
	Contract: kind="select", slot="value"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SelectValueProps } from "./types.js";

let { children, class: className, ...rest }: SelectValueProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectValue");
</script>

<span
	{...rest}
	data-kind="select"
	data-slot="value"
	class={cn(className)}
>
	{@render children?.()}
</span>
