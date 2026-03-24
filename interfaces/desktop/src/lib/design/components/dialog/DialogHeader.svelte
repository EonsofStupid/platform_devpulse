<!--
	@component Dialog.Header
	@kind dialog
	@slot header
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogHeaderProps } from "./types.js";

let { children, class: className, ...rest }: DialogHeaderProps = $props();
const ctx = getDialogContext();
</script>

<div data-kind="dialog" data-slot="header" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
