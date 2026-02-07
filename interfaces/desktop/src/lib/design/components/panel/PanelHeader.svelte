<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getPanelComponentContext } from "./context.js";
import type { PanelHeaderProps } from "./types.js";

let { children, class: className, ...rest }: PanelHeaderProps = $props();
const { classes } = getPanelComponentContext();
</script>

<div
	{...rest}
	data-kind="panel"
	data-slot="header"
	class={cn(classes.header, className)}
>
	{@render children?.()}
</div>
