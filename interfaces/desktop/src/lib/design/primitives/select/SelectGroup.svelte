<!--
	@component SelectGroup
	@description Structural grouping container for select items.
	Contract: kind="select", slot="group"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SelectGroupProps } from "./types.js";

let { children, class: className, ...rest }: SelectGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectGroup");
</script>

<div
	{...rest}
	data-kind="select"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
