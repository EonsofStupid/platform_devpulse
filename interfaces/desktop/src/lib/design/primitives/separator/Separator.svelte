<!--
  @component SeparatorPrimitive
  @kind separator
  @slot root
  @element hr
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { HTMLAttributes } from "svelte/elements";

interface SeparatorPrimitiveProps extends Omit<HTMLAttributes<HTMLHRElement>, "style" | "children"> {
	class?: string;
	orientation?: "horizontal" | "vertical";
}

let { class: className, orientation = "horizontal", ...rest }: SeparatorPrimitiveProps = $props();
</script>

<hr
	data-kind="separator"
	data-slot="root"
	data-orientation={orientation}
	class={cn(
		"border-none",
		orientation === "vertical" ? "h-auto w-px self-stretch" : "h-px w-full",
		className,
	)}
	{...rest}
/>
