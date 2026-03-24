<!--
	@component Nav
	@kind nav
	@layer components

	Navigation container. Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { NavComponentProps } from "./types.js";

let {
	label,
	size = "md",
	orientation = "horizontal",
	children,
	class: className,
	...rest
}: NavComponentProps = $props();

const styleId = "nav-default";
</script>

<StyleMacro kind="nav" style={styleId}>
	<nav
		aria-label={label}
		data-kind="nav"
		data-slot="root"
		data-orientation={orientation}
		class={cn("flex", orientation === "vertical" ? "flex-col" : "flex-row", className)}
		{...rest}
	>
		{@render children?.()}
	</nav>
</StyleMacro>
