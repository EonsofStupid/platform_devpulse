<!--
	@component Separator
	@description Structural divider. Supports decorative and focusable variants.
	Contract: kind="separator", slot="root"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SeparatorProps } from "./types.js";

let {
	orientation = "horizontal",
	decorative = true,
	children,
	class: className,
	...rest
}: SeparatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Separator");
</script>

<div
	{...rest}
	data-kind="separator"
	data-slot="root"
	data-orientation={orientation}
	class={cn(className)}
>
	{@render children?.()}
</div>
