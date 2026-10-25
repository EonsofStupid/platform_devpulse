<!--
	@component SelectLabel
	@description Structural label for a select group.
	Contract: kind="select", slot="label"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SelectLabelProps } from "./types.js";

let { children, class: className, ...rest }: SelectLabelProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectLabel");
</script>

<div
	{...rest}
	data-kind="select"
	data-slot="label"
	class={cn(className)}
>
	{@render children?.()}
</div>
