<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDialogComponentContext } from "./context.js";
import type { DialogPortalProps } from "./types.js";

let { children, class: className, ...rest }: DialogPortalProps = $props();
const { transport, classes } = getDialogComponentContext();
</script>

<div
	{...transport.slots.portal}
	{...rest}
	data-kind="dialog"
	data-slot="portal"
	class={cn(classes.portal, className)}
>
	{@render children?.()}
</div>
