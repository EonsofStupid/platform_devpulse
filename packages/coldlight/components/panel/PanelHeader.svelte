<script lang="ts">
import { panelAnatomy } from "#coldlight/primitives/panel/anatomy.js";
import { cn } from "#coldlight/utils/cn.js";
import { getPanelComponentContext, PADDING_MAP } from "./context.js";
import type { PanelHeaderProps } from "./types.js";

let { children, class: className, ...rest }: PanelHeaderProps = $props();

const ctx = getPanelComponentContext();
</script>

<div {...rest} {...panelAnatomy.attrs.header} class={cn(PADDING_MAP[ctx.padding], className)}>
	{@render children?.()}
</div>
