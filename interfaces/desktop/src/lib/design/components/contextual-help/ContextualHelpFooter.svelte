<!--
	@component ContextualHelp.Footer
	@kind contextual-help
	@slot footer
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getContextualHelpContext } from "./context.js";
import type { ContextualHelpFooterProps } from "./types.js";

let { children, class: className, ...rest }: ContextualHelpFooterProps = $props();
const ctx = getContextualHelpContext();
</script>

<div
	data-kind="contextual-help"
	data-slot="footer"
	class={cn(ctx.classes.footer, className)}
	{...rest}
>
	{@render children?.()}
</div>
