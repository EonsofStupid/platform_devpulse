<!--
	@component Panel
	@kind panel
	@layer components

	The owner's glass panel: header, body and footer on a glass void fill, with the
	GlassPanel fills and glows. Its look is panel.tokens.json's generated CSS.
-->
<script lang="ts">
import { panelAnatomy } from "#coldlight/primitives/panel/anatomy.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { setPanelComponentContext } from "./context.js";
import { PANEL_DEFAULTS } from "./panel.generated.js";
import type { PanelProps } from "./types.js";

let {
	padding = "md",
	variant = PANEL_DEFAULTS.variant,
	glow,
	surface,
	children,
	class: className,
	...rest
}: PanelProps = $props();

setPanelComponentContext({
	get padding() {
		return padding;
	},
});
</script>

<div
	{...rest}
	{...panelAnatomy.attrs.root}
	{...styleAttrs({ kind: "panel", variant, tone: glow, surface })}
	class={cn("flex flex-col overflow-hidden", className)}
>
	{@render children?.()}
</div>
