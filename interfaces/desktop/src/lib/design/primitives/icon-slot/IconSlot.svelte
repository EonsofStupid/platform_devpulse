<!--
  @component IconSlot
  @kind icon-slot
  @layer primitive
  @category structural
  @description Container for icon components. Handles sizing, shrink prevention,
  and aria-hidden. Used by buttons, badges, widget headers, nav items.

  @element span
  @slots root
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "$lib/design/utils/cn.js";

interface IconSlotProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	/** Icon size class. Default: size-4 (1rem) */
	size?: string;
}

let { children, class: className, size = "size-4", ...rest }: IconSlotProps = $props();
</script>

<span
	data-kind="icon-slot"
	data-slot="root"
	class={cn("inline-flex items-center justify-center shrink-0", size, className)}
	aria-hidden="true"
	{...rest}
>
	{@render children?.()}
</span>
