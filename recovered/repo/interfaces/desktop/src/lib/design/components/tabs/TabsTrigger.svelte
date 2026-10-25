<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getTabsComponentContext } from "./context.js";
import type { TabsTriggerProps } from "./types.js";

let { value, disabled, children, class: className, ...rest }: TabsTriggerProps = $props();
const { transport, classes } = getTabsComponentContext();
</script>

<button
	{...transport.getTrigger(value, disabled)}
	{...rest}
	data-kind="tabs"
	data-slot="trigger"
	class={cn(classes.trigger, className)}
>
	{@render children?.()}
</button>
