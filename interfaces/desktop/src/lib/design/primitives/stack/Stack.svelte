<!--
  @component Stack
  @kind stack
  @layer primitive
  @category structural
  @description Vertical flex layout with gap. The most common layout primitive.
  Flex direction column, configurable gap, align, justify.

  @element div
  @slots root
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "$lib/design/utils/cn.js";

interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	/** Gap between children. Tailwind gap class (e.g., "1", "2", "3", "4") */
	gap?: string;
	/** Cross-axis alignment */
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	/** Main-axis justification */
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

const ALIGN: Record<string, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};

const JUSTIFY: Record<string, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
};

let { children, class: className, gap = "0", align, justify, ...rest }: StackProps = $props();
</script>

<div
	data-kind="stack"
	data-slot="root"
	class={cn(
		"flex flex-col",
		gap !== "0" && `gap-${gap}`,
		align && ALIGN[align],
		justify && JUSTIFY[justify],
		className,
	)}
	{...rest}
>
	{@render children?.()}
</div>
