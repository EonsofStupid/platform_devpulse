<!--
  @component Row
  @kind row
  @layer primitive
  @category structural
  @description Horizontal flex layout with gap. For inline content, key-value pairs,
  health rows, stat rows, toolbar items.

  @element div
  @slots root
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "$lib/design/utils/cn.js";

interface RowProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	gap?: string;
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	/** Wrap children when they overflow */
	wrap?: boolean;
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

let {
	children,
	class: className,
	gap = "0",
	align = "center",
	justify,
	wrap = false,
	...rest
}: RowProps = $props();
</script>

<div
	data-kind="row"
	data-slot="root"
	class={cn(
		"flex",
		gap !== "0" && `gap-${gap}`,
		ALIGN[align],
		justify && JUSTIFY[justify],
		wrap && "flex-wrap",
		className,
	)}
	{...rest}
>
	{@render children?.()}
</div>
