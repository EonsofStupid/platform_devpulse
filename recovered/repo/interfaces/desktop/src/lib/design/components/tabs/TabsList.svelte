<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getTabsComponentContext } from "./context.js";
import type { TabsListProps } from "./types.js";

let { children, class: className, ...rest }: TabsListProps = $props();
const { transport, classes } = getTabsComponentContext();
</script>

<div
	{...transport.slots.list}
	{...rest}
	data-kind="tabs"
	data-slot="list"
	class={cn(classes.list, className)}
>
	{@render children?.()}
</div>
