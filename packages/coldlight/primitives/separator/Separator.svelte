<!--
  @component Separator
  @kind separator
  @layer primitive
  @category structural
  @description Visual divider between content sections.
  @element hr
  @slots root
  @spec separator.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { separatorSpec } from "./separator.spec.js";
import type { SeparatorPrimitiveProps } from "./types.js";

let { class: className, orientation = "horizontal", ...rest }: SeparatorPrimitiveProps = $props();

let rootEl: HTMLHRElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, separatorSpec, "root");
	}
});
</script>

<hr
	bind:this={rootEl}
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
