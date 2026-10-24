<!--
  @component Row
  @kind row
  @layer primitive
  @category structural
  @description Horizontal flex layout with gap.
  @element div
  @slots root
  @spec row.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { rowSpec } from "./row.spec.js";
import type { RowPrimitiveProps } from "./types.js";

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
}: RowPrimitiveProps = $props();

let rootEl: HTMLDivElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, rowSpec, "root");
	}
});
</script>

<div
	bind:this={rootEl}
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
