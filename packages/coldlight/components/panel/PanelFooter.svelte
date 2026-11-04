<script lang="ts">
import { panelAnatomy } from "#coldlight/primitives/panel/anatomy.js";
import { cn } from "#coldlight/utils/cn.js";
import { getPanelComponentContext, PADDING_MAP } from "./context.js";
import type { PanelFooterProps } from "./types.js";

let { children, class: className, ...rest }: PanelFooterProps = $props();

const ctx = getPanelComponentContext();
</script>

<div {...rest} {...panelAnatomy.attrs.footer} class={cn(PADDING_MAP[ctx.padding], className)}>
	{@render children?.()}
</div>
