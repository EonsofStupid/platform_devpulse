<!--
	@component Dialog.Footer
	@kind dialog
	@slot footer
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogFooterProps } from "./types.js";

let { children, class: className, ...rest }: DialogFooterProps = $props();
const ctx = getDialogContext();
</script>

<div data-kind="dialog" data-slot="footer" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
