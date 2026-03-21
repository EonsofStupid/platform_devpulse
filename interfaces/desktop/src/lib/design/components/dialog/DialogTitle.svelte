<!--
	@component Dialog.Title
	@kind dialog
	@slot title
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogTitleProps } from "./types.js";

let { children, class: className, ...rest }: DialogTitleProps = $props();
const ctx = getDialogContext();
</script>

<h2 {...ctx.hook.title} id={ctx.ids.title ?? ctx.hook.title.id} class={cn(ctx.classes.title, className)} {...rest}>
	{@render children?.()}
</h2>
