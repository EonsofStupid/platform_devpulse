<!--
	@component AlertDialogTrigger
	@kind alert-dialog
	@slot trigger
	@layer components

	Button that opens the alert dialog.
	ColdLight-owned ARIA: aria-haspopup="dialog", aria-expanded, aria-controls.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getAlertDialogContext } from "./context.js";
import type { AlertDialogTriggerProps } from "./types.js";

let { children, class: className, ...rest }: AlertDialogTriggerProps = $props();
const ctx = getAlertDialogContext();

function handleClick(): void {
	ctx.setOpen(true);
}
</script>

<button
	type="button"
	aria-haspopup="dialog"
	aria-expanded={ctx.open}
	aria-controls={ctx.contentId}
	onclick={handleClick}
	use:ctx.registerTrigger
	class={cn(className)}
	data-kind="alert-dialog"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
