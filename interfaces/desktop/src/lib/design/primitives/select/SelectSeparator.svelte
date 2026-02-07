<!--
	@component SelectSeparator
	@description Structural visual divider for select.
	Contract: kind="select", slot="separator"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SelectSeparatorProps } from "./types.js";

let { children, class: className, ...rest }: SelectSeparatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectSeparator");
</script>

<div
	{...rest}
	data-kind="select"
	data-slot="separator"
	class={cn(className)}
>
	{@render children?.()}
</div>
