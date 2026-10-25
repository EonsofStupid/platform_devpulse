<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDialogComponentContext } from "./context.js";
import type { DialogCloseProps } from "./types.js";

let { children, class: className, ...rest }: DialogCloseProps = $props();
const { transport, classes } = getDialogComponentContext();
</script>

<button
	{...transport.slots.close}
	{...rest}
	data-kind="dialog"
	data-slot="close"
	class={cn(classes.close, className)}
>
	{@render children?.()}
</button>
