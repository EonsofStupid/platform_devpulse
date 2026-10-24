<!--
  @component Stack
  @kind stack
  @layer primitive
  @category structural
  @description Vertical flex layout with gap. The most common layout primitive.
  @element div
  @slots root
  @spec stack.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { stackSpec } from "./stack.spec.js";
import type { StackPrimitiveProps } from "./types.js";

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
	align,
	justify,
	...rest
}: StackPrimitiveProps = $props();

let rootEl: HTMLDivElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, stackSpec, "root");
	}
});
</script>

<div
	bind:this={rootEl}
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
