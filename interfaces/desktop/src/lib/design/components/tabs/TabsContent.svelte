<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getTabsComponentContext } from "./context.js";
import type { TabsContentProps } from "./types.js";

let { value, children, class: className, ...rest }: TabsContentProps = $props();
const { transport, classes } = getTabsComponentContext();
</script>

<div
	{...transport.getContent(value)}
	{...rest}
	data-kind="tabs"
	data-slot="content"
	class={cn(classes.content, className)}
>
	{@render children?.()}
</div>
