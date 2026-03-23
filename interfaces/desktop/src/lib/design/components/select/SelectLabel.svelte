<!--
	@component SelectLabel
	@kind select
	@layer components

	Select label — associates a text label with the select.
	MeltUI transport provides id linking for accessibility.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import { selectComposition } from "./composition.js";
import type { SelectLabelProps } from "./types.js";

let { children, class: className, ...rest }: SelectLabelProps = $props();

const transport = getSelectContext();
const composition = selectComposition();
</script>

<span
	{...transport.slots.label}
	class={cn(composition.label, className)}
	data-kind="select"
	data-slot="label"
	{...rest}
>
	{@render children?.()}
</span>
