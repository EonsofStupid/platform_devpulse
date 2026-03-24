<!--
	@component Dialog.Description
	@kind dialog
	@slot description
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogDescriptionProps } from "./types.js";

let { children, class: className, ...rest }: DialogDescriptionProps = $props();
const ctx = getDialogContext();
</script>

<p {...ctx.hook.description} id={ctx.ids.description ?? ctx.hook.description.id} data-kind="dialog" data-slot="description" class={cn(className)} {...rest}>
	{@render children?.()}
</p>
