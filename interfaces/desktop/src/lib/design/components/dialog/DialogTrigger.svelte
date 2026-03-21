<!--
	@component Dialog.Trigger
	@kind dialog
	@slot trigger
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogTriggerProps } from "./types.js";

let { children, class: className, ...rest }: DialogTriggerProps = $props();
const ctx = getDialogContext();
</script>

<button
	{...ctx.hook.trigger}
	use:ctx.hook.attachTrigger
	id={ctx.ids.trigger}
	class={cn(ctx.classes.trigger, className)}
>
	{@render children?.()}
</button>
