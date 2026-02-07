<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getPanelComponentContext } from "./context.js";
import type { PanelBodyProps } from "./types.js";

let { children, class: className, ...rest }: PanelBodyProps = $props();
const { classes } = getPanelComponentContext();
</script>

<div
	{...rest}
	data-kind="panel"
	data-slot="body"
	class={cn(classes.body, className)}
>
	{@render children?.()}
</div>
