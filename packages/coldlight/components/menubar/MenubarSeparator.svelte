<!--
	@component MenubarSeparator
	@kind menubar
	@slot separator
	@layer components

	Visual and semantic separator between menubar menu items.
	ARIA: role="separator".
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import type { MenubarSeparatorProps } from "./types.js";

let { class: className, ...rest }: MenubarSeparatorProps = $props();
</script>

<div
	role="separator"
	class={cn("h-px my-1", className)}
	data-kind="menubar"
	data-slot="separator"
	{...rest}
></div>
