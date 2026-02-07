<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getPanelComponentContext } from "./context.js";
import type { PanelFooterProps } from "./types.js";

let { children, class: className, ...rest }: PanelFooterProps = $props();
const { classes } = getPanelComponentContext();
</script>

<div
	{...rest}
	data-kind="panel"
	data-slot="footer"
	class={cn(classes.footer, className)}
>
	{@render children?.()}
</div>
