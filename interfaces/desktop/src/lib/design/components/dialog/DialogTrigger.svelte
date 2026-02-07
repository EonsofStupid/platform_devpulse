<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDialogComponentContext } from "./context.js";
import type { DialogTriggerProps } from "./types.js";

let { children, class: className, ...rest }: DialogTriggerProps = $props();
const { transport, classes } = getDialogComponentContext();
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	data-kind="dialog"
	data-slot="trigger"
	class={cn(classes.trigger, className)}
	use:transport.attachTrigger
>
	{@render children?.()}
</button>
