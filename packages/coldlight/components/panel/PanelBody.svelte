<script lang="ts">
import { panelAnatomy } from "#coldlight/primitives/panel/anatomy.js";
import { cn } from "#coldlight/utils/cn.js";
import { getPanelComponentContext, PADDING_MAP } from "./context.js";
import type { PanelBodyProps } from "./types.js";

let { children, class: className, ...rest }: PanelBodyProps = $props();

const ctx = getPanelComponentContext();
</script>

<div {...rest} {...panelAnatomy.attrs.body} class={cn("flex-1 overflow-auto", PADDING_MAP[ctx.padding], className)}>
	{@render children?.()}
</div>
