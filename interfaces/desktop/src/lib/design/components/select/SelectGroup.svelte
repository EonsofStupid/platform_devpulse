<!--
	@component SelectGroup
	@kind select
	@layer components

	Select group — groups related options with optional label.
	MeltUI transport provides role="group" via structural slot.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import { selectComposition } from "./composition.js";
import type { SelectGroupProps } from "./types.js";

let { children, class: className, ...rest }: SelectGroupProps = $props();

const transport = getSelectContext();
const composition = selectComposition();
</script>

<div
	{...transport.slots.group}
	class={cn(composition.group, className)}
	data-kind="select"
	data-slot="group"
	{...rest}
>
	{@render children?.()}
</div>
