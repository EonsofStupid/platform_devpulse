<!--
  @component IconSlot
  @kind icon-slot
  @layer primitive
  @category structural
  @description Container for icon components. Handles sizing, shrink prevention, and aria-hidden.
  @element span
  @slots root
  @spec icon-slot.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { iconSlotSpec } from "./icon-slot.spec.js";
import type { IconSlotPrimitiveProps } from "./types.js";

let { children, class: className, size = "size-4", ...rest }: IconSlotPrimitiveProps = $props();

let rootEl: HTMLSpanElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, iconSlotSpec, "root");
	}
});
</script>

<span
	bind:this={rootEl}
	data-kind="icon-slot"
	data-slot="root"
	class={cn("inline-flex items-center justify-center shrink-0", size, className)}
	aria-hidden="true"
	{...rest}
>
	{@render children?.()}
</span>
