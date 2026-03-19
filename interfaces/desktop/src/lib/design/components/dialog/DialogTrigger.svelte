<!--
	@component DialogTrigger
	@kind dialog
	@slot trigger
	@layer components

	Button that opens the dialog. Spreads adapter trigger slot attrs
	(aria-haspopup, aria-expanded, aria-controls, onclick).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogTriggerProps } from "./types.js";

let { children, class: className, ...rest }: DialogTriggerProps = $props();
const dialog = getDialogContext();
</script>

<button
	{...dialog.trigger}
	use:dialog.attachTrigger
	class={cn(className)}
	data-kind="dialog"
	data-slot="trigger"
	data-state={dialog.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
